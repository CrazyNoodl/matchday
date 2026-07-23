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

// Under Playwright only (`EXPO_PUBLIC_E2E`, set in playwright.config.ts's
// webServer.env), the CLOSE animation specifically is made instant. Its
// completion callback (`onClose` below) is what unmounts the backdrop and
// content — under a CPU-starved parallel test run that callback can stall
// indefinitely, leaving the backdrop mounted and blocking clicks on whatever
// is underneath for the rest of the test (see docs/CONTEXT.md's
// `02.setup.spec.ts` flakiness notes — this reproduces on unmodified `dev`
// too, so it's a real risk for slow real devices, not just a test artifact).
//
// Deliberately NOT applied to opening (`snapToIndex`, below) too — doing
// that once caused a *worse* regression: with the backdrop appearing fully
// interactive on the very same synchronous tick as the click that opened the
// sheet, Playwright's mousedown/mouseup pair for that click could land back
// on the now-instantly-present backdrop and immediately close the sheet it
// had just opened (confirmed via instrumented logging — `visible` flipping
// true→false within ~2ms of the open, with `onClose` firing before any
// content ever rendered). Leaving open at normal speed keeps a small buffer
// between "sheet opens" and "backdrop becomes clickable".
const CLOSE_ANIMATION_CONFIGS = process.env.EXPO_PUBLIC_E2E
  ? { reduceMotion: ReduceMotion.Always }
  : undefined;

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
  // Content stays mounted through the close animation (sliding off-screen),
  // then unmounts once the library reports it fully closed — otherwise it
  // lingers in the DOM with a non-zero, off-screen bounding box, which reads
  // as "visible" to accessibility tooling and Playwright alike.
  const [isOpen, setIsOpen] = useState(false);
  const keyboardHeight = useKeyboardHeight(avoidKeyboard);
  // Tracks whether the sheet was closed programmatically (visible→false) so
  // we don't fire onClose when the library's animation finishes — that would
  // reset modal state and dismiss any dialog that replaced this sheet.
  const closedExternallyRef = useRef(false);

  useEffect(() => {
    if (visible) {
      closedExternallyRef.current = false;
      setEverOpened(true);
      setIsOpen(true);
      ref.current?.snapToIndex(0);
    } else {
      closedExternallyRef.current = true;
      ref.current?.close(CLOSE_ANIMATION_CONFIGS);
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
              setIsOpen(false);
              if (!closedExternallyRef.current) onClose();
              closedExternallyRef.current = false;
            }
      }
    >
      {everOpened &&
        isOpen &&
        (snapToMax ? (
          children
        ) : (
          <BottomSheetView onLayout={handleLayout}>{children}</BottomSheetView>
        ))}
    </BottomSheet>
  );
}
