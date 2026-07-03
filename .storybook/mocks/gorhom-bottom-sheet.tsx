import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, ScrollView, type ViewProps, type ScrollViewProps } from 'react-native';

// Storybook-only stand-in for @gorhom/bottom-sheet. The real component's
// open/close animation is driven by react-native-reanimated shared values
// via an imperative ref (snapToIndex/close) — Vite's dependency pre-bundler
// resolves Reanimated's precompiled `lib/module` build instead of the raw
// `src` entry Metro processes with the reanimated babel plugin, so those
// shared values never update and the sheet stays visually stuck closed.
// This stub renders the same content with plain React state instead, so
// Sheet/NewRoundModal stories are actually inspectable in the browser.

export interface BottomSheetRef {
  snapToIndex: (index: number) => void;
  snapToPosition: () => void;
  expand: () => void;
  collapse: () => void;
  close: () => void;
  forceClose: () => void;
}

interface BottomSheetProps extends ViewProps {
  index?: number;
  snapPoints?: (number | string)[];
  backgroundStyle?: ViewProps['style'];
  handleIndicatorStyle?: ViewProps['style'];
  children?: React.ReactNode;
  onClose?: () => void;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { index = -1, snapPoints, backgroundStyle, handleIndicatorStyle, children, style, onClose },
  ref,
) {
  const [open, setOpen] = useState(index >= 0);

  useImperativeHandle(ref, () => ({
    snapToIndex: (i: number) => setOpen(i >= 0),
    snapToPosition: () => setOpen(true),
    expand: () => setOpen(true),
    collapse: () => setOpen(false),
    close: () => setOpen(false),
    forceClose: () => setOpen(false),
  }));

  if (!open) return null;

  const height = Array.isArray(snapPoints) ? snapPoints[snapPoints.length - 1] : undefined;
  const close = () => {
    setOpen(false);
    onClose?.();
  };

  // `fixed` (not `absolute`) — the Storybook decorator chain
  // (GestureHandlerRootView → SafeAreaProvider → padding wrapper) doesn't
  // reliably propagate a definite height for `absolute`/percentage
  // positioning to resolve against, so anchor straight to the viewport
  // instead. `position: 'fixed'` isn't in RN's cross-platform ViewStyle
  // type (web-only, via react-native-web) — cast needed here only.
  const fixed = { position: 'fixed' } as unknown as { position: 'absolute' };

  return (
    <>
      <View
        style={[fixed, { top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' }]}
        onTouchEnd={close}
      />
      <View
        style={[
          fixed,
          { left: 0, right: 0, bottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
          backgroundStyle,
          typeof height === 'number' ? { height } : null,
          style,
        ]}
      >
        <View style={[{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginVertical: 8 }, handleIndicatorStyle]} />
        {children}
      </View>
    </>
  );
});

export default BottomSheet;

export function BottomSheetView(props: ViewProps) {
  return <View {...props} />;
}

export function BottomSheetScrollView(props: ScrollViewProps) {
  return <ScrollView {...props} />;
}

export interface BottomSheetBackdropProps {
  appearsOnIndex?: number;
  disappearsOnIndex?: number;
  opacity?: number;
  pressBehavior?: string;
}

export function BottomSheetBackdrop(_props: BottomSheetBackdropProps) {
  return null;
}
