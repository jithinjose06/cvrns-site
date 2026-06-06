/**
 * Minimal accessible overlay focus management shared by the cart and the
 * mobile drawer:
 *  - moves focus into the overlay when it opens,
 *  - traps Tab / Shift+Tab within it,
 *  - restores focus to the triggering element on close.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
  );
}

export interface OverlayController {
  /** open the overlay; pass the triggering element so focus can return to it
   *  (needed because clicking a button doesn't focus it on macOS/WebKit) */
  open: (trigger?: HTMLElement | null) => void;
  close: () => void;
  readonly isOpen: boolean;
}

export function createOverlay(opts: {
  /** element that receives the focus trap (the panel/drawer) */
  container: HTMLElement;
  /** apply visual open state (add classes, lock scroll, etc.) */
  onOpen: () => void;
  /** revert visual open state */
  onClose: () => void;
  /** element to focus first; defaults to the first focusable in container */
  initialFocus?: () => HTMLElement | null;
}): OverlayController {
  let open = false;
  let lastFocused: HTMLElement | null = null;

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      controller.close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusable(opts.container);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const controller: OverlayController = {
    get isOpen() {
      return open;
    },
    open(trigger?: HTMLElement | null) {
      if (open) return;
      lastFocused = trigger ?? (document.activeElement as HTMLElement | null);
      open = true;
      opts.onOpen();
      const target = () => opts.initialFocus?.() ?? focusable(opts.container)[0] ?? null;
      // defer so the element is focusable after the open transition starts;
      // re-assert shortly after for WebKit, which can ignore focus mid-transition
      requestAnimationFrame(() => {
        const t = target();
        t?.focus();
        if (document.activeElement !== t) setTimeout(() => target()?.focus(), 80);
      });
      document.addEventListener('keydown', handleKeydown, true);
    },
    close() {
      if (!open) return;
      open = false;
      opts.onClose();
      document.removeEventListener('keydown', handleKeydown, true);
      lastFocused?.focus();
    },
  };

  return controller;
}
