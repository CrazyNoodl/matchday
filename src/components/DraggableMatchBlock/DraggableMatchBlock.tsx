import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { type Match } from '../../store/types';
import { useColors } from '../../theme';
import { makeStyles } from './DraggableMatchBlock.styles';

// Fallback used for a row's swap threshold before its real height has been
// measured via onLayout (e.g. the very first frame of a drag).
const DEFAULT_ROW_HEIGHT = 64;
const SPRING_CONFIG = { damping: 20, stiffness: 220 };

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

interface RowSharedValues {
  translateY: SharedValue<number>;
  crossedOffset: SharedValue<number>;
}

interface DraggableMatchBlockProps {
  matches: Match[];
  reorderEnabled: boolean;
  onReorder: (newOrderIds: string[]) => void;
  itemStyle?: StyleProp<ViewStyle>;
  lastItemStyle?: StyleProp<ViewStyle>;
  renderCard: (match: Match, cardStyle: StyleProp<ViewStyle>) => React.ReactNode;
}

export function DraggableMatchBlock({
  matches,
  reorderEnabled,
  onReorder,
  itemStyle,
  lastItemStyle,
  renderCard,
}: DraggableMatchBlockProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  const [order, setOrderState] = useState<string[]>(() => matches.map((m) => m.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const matchById = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);
  const heights = useRef<Record<string, number>>({});
  const rowSharedValues = useRef<Record<string, RowSharedValues>>({});
  // Mirrors `order` so callbacks (invoked outside React's render/commit via
  // runOnJS) can read the latest value directly instead of reaching for the
  // functional setState form — calling side effects (committing to the
  // store) from inside a setState updater runs during React's render phase
  // and can trip "Cannot update a component while rendering a different
  // component" if another component happens to be subscribed to that state.
  const orderRef = useRef(order);

  // Re-rendering with a new `order` reshuffles the mapped children, which
  // moves the actively-dragged row's DOM node to a new sibling position —
  // browsers/gesture-handler treat that as the pointer being lost mid-drag
  // and silently end the gesture. That capped every continuous drag at a
  // single swap (releasing and re-pressing "worked" because it started a
  // fresh gesture on the now-repositioned node). So during a drag,
  // `updatePendingOrder` only mutates the ref — nothing re-renders, nothing
  // moves — and `commitOrder` (called once, from onEnd) is the only thing
  // that ever pushes a reorder into rendered state.
  const updatePendingOrder = useCallback((next: string[]) => {
    orderRef.current = next;
  }, []);
  const commitOrder = useCallback((next: string[]) => {
    orderRef.current = next;
    setOrderState(next);
  }, []);

  // Pick up store updates (e.g. from elsewhere) but never clobber an
  // in-progress drag's local order.
  useEffect(() => {
    if (draggingId !== null) return;
    const ids = matches.map((m) => m.id);
    if (!arraysEqual(orderRef.current, ids)) commitOrder(ids);
  }, [matches, draggingId, commitOrder]);

  const registerRow = useCallback((id: string, values: RowSharedValues) => {
    rowSharedValues.current[id] = values;
  }, []);
  const unregisterRow = useCallback((id: string) => {
    delete rowSharedValues.current[id];
  }, []);

  const handleLayout = useCallback((id: string, e: LayoutChangeEvent) => {
    heights.current[id] = e.nativeEvent.layout.height;
  }, []);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  // Swaps the dragged row past whichever neighbors it has travelled more than
  // halfway over — the classic reorder-list heuristic. Loops rather than
  // swapping once per call: a single onUpdate frame can carry a translation
  // spanning several row heights (a fast flick, or coarse mouse sampling on
  // web), and without the loop the dragged row could only ever advance one
  // slot per frame no matter how far the pointer actually moved.
  const handleDragUpdate = useCallback(
    (id: string, translationY: number) => {
      const rowValues = rowSharedValues.current[id];
      if (!rowValues) return;

      let order = orderRef.current;
      let idx = order.indexOf(id);
      if (idx === -1) return;
      let changed = false;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const remaining = translationY - rowValues.crossedOffset.value;

        if (remaining > 0) {
          const nextId = order[idx + 1];
          if (!nextId) break;
          const nextHeight = heights.current[nextId] ?? DEFAULT_ROW_HEIGHT;
          if (remaining <= nextHeight / 2) break;
          rowValues.crossedOffset.value += nextHeight;
          const next = [...order];
          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
          order = next;
          idx += 1;
          changed = true;
          continue;
        }

        if (remaining < 0) {
          const prevId = order[idx - 1];
          if (!prevId) break;
          const prevHeight = heights.current[prevId] ?? DEFAULT_ROW_HEIGHT;
          if (-remaining <= prevHeight / 2) break;
          rowValues.crossedOffset.value -= prevHeight;
          const next = [...order];
          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
          order = next;
          idx -= 1;
          changed = true;
          continue;
        }

        break;
      }

      if (changed) updatePendingOrder(order);
    },
    [updatePendingOrder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    const current = orderRef.current;
    commitOrder(current);
    const originalIds = matches.map((m) => m.id);
    if (!arraysEqual(current, originalIds)) {
      onReorder(current);
    }
  }, [matches, onReorder, commitOrder]);

  return (
    <View>
      {order.map((id, idx) => {
        const match = matchById.get(id);
        if (!match) return null;
        const cardStyle = idx < order.length - 1 ? itemStyle : lastItemStyle;
        return (
          <DraggableMatchRow
            key={id}
            id={id}
            reorderEnabled={reorderEnabled}
            isDragging={draggingId === id}
            handleLabel={t('matchday.dragToReorder')}
            styles={styles}
            onRegister={registerRow}
            onUnregister={unregisterRow}
            onLayout={handleLayout}
            onDragStart={handleDragStart}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
          >
            {renderCard(match, cardStyle)}
          </DraggableMatchRow>
        );
      })}
    </View>
  );
}

interface DraggableMatchRowProps {
  id: string;
  reorderEnabled: boolean;
  isDragging: boolean;
  handleLabel: string;
  styles: ReturnType<typeof makeStyles>;
  onRegister: (id: string, values: RowSharedValues) => void;
  onUnregister: (id: string) => void;
  onLayout: (id: string, e: LayoutChangeEvent) => void;
  onDragStart: (id: string) => void;
  onDragUpdate: (id: string, translationY: number) => void;
  onDragEnd: (id: string) => void;
  children: React.ReactNode;
}

function DraggableMatchRow({
  id,
  reorderEnabled,
  isDragging,
  handleLabel,
  styles,
  onRegister,
  onUnregister,
  onLayout,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  children,
}: DraggableMatchRowProps) {
  const translateY = useSharedValue(0);
  const crossedOffset = useSharedValue(0);

  useEffect(() => {
    onRegister(id, { translateY, crossedOffset });
    return () => onUnregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pan = Gesture.Pan()
    .enabled(reorderEnabled)
    .onStart(() => {
      crossedOffset.value = 0;
      translateY.value = 0;
      runOnJS(onDragStart)(id);
    })
    .onUpdate((e) => {
      translateY.value = e.translationY - crossedOffset.value;
      runOnJS(onDragUpdate)(id, e.translationY);
    })
    .onEnd(() => {
      translateY.value = withSpring(0, SPRING_CONFIG);
      runOnJS(onDragEnd)(id);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      layout={isDragging ? undefined : LinearTransition.duration(200)}
      style={[styles.row, animatedStyle, isDragging && styles.dragging]}
      onLayout={(e) => onLayout(id, e)}
    >
      <View style={styles.cardSlot}>{children}</View>
      {reorderEnabled && (
        <GestureDetector gesture={pan}>
          <View style={styles.handle} accessibilityLabel={handleLabel}>
            <View style={styles.handleIconContainer}>
              <Text style={styles.handleIcon}>⠿</Text>
            </View>
          </View>
        </GestureDetector>
      )}
    </Animated.View>
  );
}
