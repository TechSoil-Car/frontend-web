type Bounds = { left: number; right: number; top: number; bottom: number };

// panBy moves the map contents in the opposite direction of its offset.
export function popupPanOffset(popup: Bounds, viewport: Bounds): [number, number] {
  const x = popup.left < viewport.left ? popup.left - viewport.left
    : popup.right > viewport.right ? popup.right - viewport.right : 0;
  const y = popup.top < viewport.top ? popup.top - viewport.top
    : popup.bottom > viewport.bottom ? popup.bottom - viewport.bottom : 0;
  return [x, y];
}
