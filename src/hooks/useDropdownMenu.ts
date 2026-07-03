import { useCallback, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';

// Measures the trigger button on open and anchors the dropdown just below
// it, right-aligned to the button's right edge.
export function useDropdownMenu() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const anchorRef = useRef<View>(null);

  const open = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      const screenWidth = Dimensions.get('window').width;
      setPosition({ top: y + h + 6, right: screenWidth - x - w });
      setVisible(true);
    });
  }, []);

  const close = useCallback(() => setVisible(false), []);

  return { visible, position, anchorRef, open, close };
}
