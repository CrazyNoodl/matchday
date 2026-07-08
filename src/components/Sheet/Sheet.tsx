import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, type LayoutChangeEvent } from 'react-native';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/theme';

// Force sheet open/close animations to play even when the device has
// "Reduce Motion" enabled — otherwise the sheet opens with no visible
// animation and looks like it never opened at all.
const ANIMATION_CONFIGS = { reduceMotion: ReduceMotion.Never };

const MIN_HEIGHT = 280;
const MAX_HEIGHT = Dimensions.get('window').height * 0.85;

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapToMax?: boolean;
  disableClose?: boolean;
  keyboardBehavior?: 'interactive' | 'extend' | 'fillParent';
  avoidKeyboard?: boolean;
}

// Sizes itself to its actual content height via onLayout, rather than a
// caller-guessed percentage or pixel value — adapts automatically as
// content changes (more players, different wizard step, etc.).
//
// `enableDynamicSizing` (the library's own content-measuring feature) was
// tried and rejected: it defaults to `true` internally even when omitted,
// and its measurement consistently produced a too-small height in this
// app, clipping content. Measuring ourselves via onLayout and feeding the
// result into an explicit snapPoint is what's confirmed to work reliably.
//
// Open/close are driven imperatively via ref (snapToIndex/close), not the
// declarative `index` prop — the declarative path was unreliable for
// closing the sheet from a button (e.g. Cancel) in this app.
export function Sheet({
  visible,
  onClose,
  children,
  snapToMax,
  disableClose = false,
  keyboardBehavior = 'interactive',
  avoidKeyboard = false,
}: SheetProps) {
  const colors = useColors();
  const ref = useRef<BottomSheet>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [everOpened, setEverOpened] = useState(false);
  const keyboardHeight = useKeyboardHeight(avoidKeyboard);
  // Tracks whether the sheet was closed programmatically (visible→false) so
  // we don't fire onClose when the library's animation finishes — that would
  // reset modal state and dismiss any dialog that replaced this sheet.
  const closedExternallyRef = useRef(false);

  useEffect(() => {
    if (visible) {
      closedExternallyRef.current = false;
      setEverOpened(true);
      ref.current?.snapToIndex(0);
    } else {
      closedExternallyRef.current = true;
      ref.current?.close();
    }
  }, [visible]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measured = event.nativeEvent.layout.height;
      setHeight(Math.min(Math.max(measured + bottomInset, MIN_HEIGHT), MAX_HEIGHT));
    },
    [bottomInset],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.65}
        pressBehavior={disableClose ? 'none' : 'close'}
      />
    ),
    [disableClose],
  );

  const snapPoint = snapToMax ? MAX_HEIGHT : Math.min(height + keyboardHeight, MAX_HEIGHT);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={[snapPoint]}
      enableDynamicSizing={false}
      animationConfigs={ANIMATION_CONFIGS}
      enablePanDownToClose={!disableClose}
      keyboardBehavior={avoidKeyboard ? 'extend' : keyboardBehavior}
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg.sheet }}
      handleIndicatorStyle={{ backgroundColor: colors.border.strong }}
      onClose={
        disableClose
          ? undefined
          : () => {
              if (!closedExternallyRef.current) onClose();
              closedExternallyRef.current = false;
            }
      }
    >
      {everOpened &&
        (snapToMax ? (
          children
        ) : (
          <BottomSheetView onLayout={handleLayout}>{children}</BottomSheetView>
        ))}
    </BottomSheet>
  );
}
