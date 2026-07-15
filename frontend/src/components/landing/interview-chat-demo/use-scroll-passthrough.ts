import { type RefObject, useEffect } from "react";

function canScrollY(element: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(element);
  if (overflowY !== "auto" && overflowY !== "scroll") return false;
  return element.scrollHeight > element.clientHeight + 1;
}

export function useScrollPassthrough(
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      let node: HTMLElement | null =
        event.target instanceof HTMLElement ? event.target : null;
      if (!node) return;

      while (node && node !== container) {
        if (canScrollY(node)) {
          const atTop = node.scrollTop <= 0;
          const atBottom =
            node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
          const scrollingUp = event.deltaY < 0;
          const scrollingDown = event.deltaY > 0;

          if ((scrollingUp && !atTop) || (scrollingDown && !atBottom)) {
            return;
          }

          break;
        }

        node = node.parentElement;
      }

      window.scrollBy({
        top: event.deltaY,
        left: event.deltaX,
      });
    };

    container.addEventListener("wheel", onWheel, { passive: true });
    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef]);
}
