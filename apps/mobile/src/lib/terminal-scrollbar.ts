export const TERMINAL_SCROLLBAR_CSS = `
.xterm .xterm-scrollable-element>.scrollbar.vertical{width:12px!important;opacity:0!important;pointer-events:none!important;transition:opacity 220ms ease-out!important}
.xterm.scroll-active .xterm-scrollable-element>.scrollbar.vertical.visible{opacity:1!important;pointer-events:auto!important}
.xterm .xterm-scrollable-element>.scrollbar.vertical>.slider{width:3px!important;left:auto!important;right:2px!important;border-radius:999px!important}
`;
export function installTerminalScrollbar(term: {
  element: HTMLElement | undefined;
  onScroll: (listener: () => void) => { dispose: () => void };
}) {
  const element = term.element;
  if (!element) return () => {};
  let timer: ReturnType<typeof setTimeout>;
  const show = () => {
    element.classList.add("scroll-active");
    clearTimeout(timer);
    timer = setTimeout(() => element.classList.remove("scroll-active"), 750);
  };
  element.addEventListener("pointermove", show);
  const scroll = term.onScroll(show);
  return () => {
    clearTimeout(timer);
    element.removeEventListener("pointermove", show);
    element.classList.remove("scroll-active");
    scroll.dispose();
  };
}
