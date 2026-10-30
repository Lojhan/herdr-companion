import { useEffect, useRef } from "react";
import { TERMINAL_SCROLLBAR_CSS } from "@/lib/terminal-scrollbar";
import { useHerdrTheme } from "@/lib/theme";
type Entry = {
  node: HTMLElement;
  axis: "x" | "y";
  grip: HTMLDivElement;
  thumb: HTMLDivElement;
  timer?: ReturnType<typeof setTimeout>;
  visible: boolean;
};
const THICKNESS = 3,
  INSET = 2,
  HIT = 12,
  IDLE = 750;
export function GlobalScrollbars() {
  const { theme: t } = useHerdrTheme(),
    layer = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    layer.current?.style.setProperty("--scroll-thumb", t.dim);
  }, [t.dim]);
  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.herdrScrollbars = "true";
    style.textContent =
      "*{scrollbar-width:none!important;scrollbar-gutter:auto!important}*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}" +
      TERMINAL_SCROLLBAR_CSS;
    document.head.append(style);
    const root = document.createElement("div");
    root.dataset.globalScrollbars = "true";
    root.setAttribute("aria-hidden", "true");
    Object.assign(root.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "100001",
    });
    root.style.setProperty("--scroll-thumb", t.dim);
    document.body.append(root);
    layer.current = root;
    const entries = new Set<Entry>(),
      nodes = new Map<HTMLElement, Entry[]>();
    let frame = 0,
      dragging: Entry | null = null;
    const fine = matchMedia("(pointer:fine)");
    const hide = (entry: Entry) => {
      if (entry === dragging) return;
      entry.visible = false;
      entry.grip.style.opacity = "0";
      entry.grip.style.pointerEvents = "none";
    };
    const geometry = (entry: Entry) => {
      const r = entry.node.getBoundingClientRect(),
        vertical = entry.axis === "y";
      const viewport = vertical
          ? entry.node.clientHeight
          : entry.node.clientWidth,
        total = vertical ? entry.node.scrollHeight : entry.node.scrollWidth,
        offset = vertical ? entry.node.scrollTop : entry.node.scrollLeft;
      const length = Math.max(0, viewport - INSET * 2),
        thumb = Math.min(
          length,
          Math.max(24, (length * viewport) / Math.max(1, total)),
        ),
        travel = Math.max(0, length - thumb);
      return {
        r,
        vertical,
        viewport,
        total,
        offset,
        length,
        thumb,
        travel,
        position: (travel * offset) / Math.max(1, total - viewport),
      };
    };
    const draw = (entry: Entry) => {
      const g = geometry(entry);
      if (
        g.total <= g.viewport + 1 ||
        g.r.bottom <= 0 ||
        g.r.right <= 0 ||
        g.r.top >= innerHeight ||
        g.r.left >= innerWidth
      ) {
        hide(entry);
        return;
      }
      const { grip, thumb } = entry;
      Object.assign(
        grip.style,
        g.vertical
          ? {
              left: `${g.r.left + entry.node.clientLeft + entry.node.clientWidth - HIT}px`,
              top: `${g.r.top + entry.node.clientTop + INSET + g.position}px`,
              width: `${HIT}px`,
              height: `${g.thumb}px`,
            }
          : {
              left: `${g.r.left + entry.node.clientLeft + INSET + g.position}px`,
              top: `${g.r.top + entry.node.clientTop + entry.node.clientHeight - HIT}px`,
              width: `${g.thumb}px`,
              height: `${HIT}px`,
            },
      );
      Object.assign(
        thumb.style,
        g.vertical
          ? {
              top: "0",
              bottom: "0",
              right: `${INSET}px`,
              left: "auto",
              width: `${THICKNESS}px`,
              height: "auto",
            }
          : {
              left: "0",
              right: "0",
              bottom: `${INSET}px`,
              top: "auto",
              height: `${THICKNESS}px`,
              width: "auto",
            },
      );
    };
    const show = (entry: Entry) => {
      draw(entry);
      const g = geometry(entry);
      if (g.total <= g.viewport + 1) return;
      entry.visible = true;
      entry.grip.style.opacity = "1";
      entry.grip.style.pointerEvents = fine.matches ? "auto" : "none";
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => hide(entry), IDLE);
    };
    const resize = new ResizeObserver(() => {
      for (const entry of entries) if (entry.visible) draw(entry);
    });
    const add = (node: HTMLElement) => {
      if (nodes.has(node) || root.contains(node) || node.tagName === "INPUT")
        return;
      const css = getComputedStyle(node),
        axes: ("x" | "y")[] = [];
      if (/auto|scroll/.test(css.overflowY)) axes.push("y");
      if (/auto|scroll/.test(css.overflowX)) axes.push("x");
      if (!axes.length) return;
      const owned: Entry[] = [];
      nodes.set(node, owned);
      resize.observe(node);
      for (const axis of axes) {
        const grip = document.createElement("div"),
          thumb = document.createElement("div");
        grip.dataset.scrollbar = axis;
        Object.assign(grip.style, {
          position: "fixed",
          opacity: "0",
          transition: "opacity 220ms ease-out",
          pointerEvents: "none",
          touchAction: "none",
        });
        Object.assign(thumb.style, {
          position: "absolute",
          borderRadius: "999px",
          background: "var(--scroll-thumb)",
          opacity: "0.75",
        });
        grip.append(thumb);
        root.append(grip);
        const entry: Entry = { node, axis, grip, thumb, visible: false };
        owned.push(entry);
        entries.add(entry);
        grip.addEventListener("pointerenter", () => show(entry));
        grip.addEventListener("pointerdown", (event) => {
          if (event.pointerType !== "mouse") return;
          event.preventDefault();
          event.stopPropagation();
          dragging = entry;
          show(entry);
          const start = axis === "y" ? event.clientY : event.clientX,
            initial = axis === "y" ? node.scrollTop : node.scrollLeft,
            g = geometry(entry);
          const move = (e: PointerEvent) => {
            const delta = (axis === "y" ? e.clientY : e.clientX) - start,
              next =
                initial +
                (delta * (g.total - g.viewport)) / Math.max(1, g.travel);
            if (axis === "y") node.scrollTop = next;
            else node.scrollLeft = next;
            draw(entry);
          };
          const stop = () => {
            dragging = null;
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
            show(entry);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", stop, { once: true });
        });
      }
    };
    const scan = (node: Node) => {
      if (!(node instanceof HTMLElement) || root.contains(node)) return;
      add(node);
      for (const child of node.querySelectorAll<HTMLElement>("*")) add(child);
    };
    scan(document.body);
    const prune = () => {
      for (const [node, owned] of nodes)
        if (!node.isConnected) {
          resize.unobserve(node);
          nodes.delete(node);
          for (const entry of owned) {
            clearTimeout(entry.timer);
            entry.grip.remove();
            entries.delete(entry);
          }
        }
    };
    const mutations = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) scan(node);
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          prune();
          for (const entry of entries) if (entry.visible) draw(entry);
        });
    });
    mutations.observe(document.body, { subtree: true, childList: true });
    const scrolling = (event: Event) => {
      const node = event.target instanceof HTMLElement ? event.target : null;
      if (!node) return;
      for (const entry of nodes.get(node) ?? []) show(entry);
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || dragging) return;
      for (
        let node = event.target as HTMLElement | null;
        node;
        node = node.parentElement
      ) {
        const owned = nodes.get(node);
        if (owned?.some((e) => geometry(e).total > geometry(e).viewport + 1)) {
          for (const entry of owned) show(entry);
          break;
        }
      }
    };
    const windowResize = () => {
      for (const entry of entries) if (entry.visible) draw(entry);
    };
    document.addEventListener("scroll", scrolling, true);
    document.addEventListener("pointermove", hover, { passive: true });
    window.addEventListener("resize", windowResize);
    return () => {
      document.removeEventListener("scroll", scrolling, true);
      document.removeEventListener("pointermove", hover);
      window.removeEventListener("resize", windowResize);
      mutations.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      for (const entry of entries) clearTimeout(entry.timer);
      root.remove();
      style.remove();
      layer.current = null;
    };
    // Theme updates only recolor the overlay; they never rebuild scroll containers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
