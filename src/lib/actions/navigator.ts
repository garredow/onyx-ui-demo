import { get } from 'svelte/store';
import { activeGroup, getFocusedItemId, setSelectedId } from '../stores/navigator';
import { switchTab } from '../stores/view';
import { getIndexWrap } from '../utils/array';

type Config = {
  groupId: any;
  initialSelectedId?: string;
  enableTabSwitching?: boolean;
};

export function navigator(node: HTMLElement, config: Config) {
  // node.dataset.navGroup = config.groupId;

  if (config.initialSelectedId) {
    const item = node.querySelector(`[data-nav-id=${config.initialSelectedId}]`);
    if (item) {
      setSelectedId(config.groupId, config.initialSelectedId);
      item?.dispatchEvent(new CustomEvent('itemfocus'));
    }
  }

  function handleKeyPress(ev: KeyboardEvent) {
    const groupActive = get(activeGroup)?.id === config.groupId;

    // Check if valid key
    const target = ev.target as HTMLElement | null;
    const dpadKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
    const shortcutKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (
      !groupActive ||
      ![...dpadKeys, ...shortcutKeys].includes(ev.key) ||
      (shortcutKeys.includes(ev.key) && target?.tagName.toLowerCase() === 'input')
    ) {
      return;
    }
    // console.log(`Group ${config.groupId} handling key`);

    // Handle tab switching first
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      if (config.enableTabSwitching) switchTab(ev.key === 'ArrowLeft' ? -1 : 1);
      return;
    }

    const scroller: HTMLElement = node.querySelector(`[data-nav-scroller]`);

    const focusedItemId = getFocusedItemId(config.groupId);
    const items: HTMLElement[] = Array.from(node.querySelectorAll(`[data-nav-id]`));
    const currentItemIndex = items.findIndex((a) => a.dataset.navId === focusedItemId);

    // Handle Enter key
    if (items[currentItemIndex] && ev.key === 'Enter') {
      items[currentItemIndex].dispatchEvent(new CustomEvent('itemfocus'));
      items[currentItemIndex].dispatchEvent(new CustomEvent('itemselect'));
      return;
    }

    // Handle shortcut keys
    const shortcutItem = items.find((a) => a.dataset.navShortcut === ev.key);
    if (shortcutItem) {
      scrollIntoView(scroller, shortcutItem, 'auto');
      setSelectedId(config.groupId, shortcutItem.dataset.navId);
      items[currentItemIndex]?.dispatchEvent(new CustomEvent('itemblur'));
      shortcutItem.dispatchEvent(new CustomEvent('itemfocus'));
      shortcutItem.dispatchEvent(new CustomEvent('itemselect'));
      return;
    } else if (shortcutKeys.includes(ev.key)) {
      return;
    }

    // If at first item and more content above, scroll up
    if (
      scroller &&
      (items.length === 0 || currentItemIndex === 0) &&
      ev.key === 'ArrowUp' &&
      scroller.scrollTop > 0
    ) {
      console.log('scroll up'); // TODO: Scroll
      scrollContent('up', scroller);
      return;
    }

    // If at last item and more content below, scroll down
    if (
      scroller &&
      currentItemIndex === items.length - 1 &&
      ev.key === 'ArrowDown' &&
      scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight
    ) {
      console.log('scroll down'); // TODO: Scroll
      scrollContent('down', scroller);
      return;
    }

    // Find next item and scroll to it
    let nextItem = null;
    if (ev.key === 'ArrowUp' && currentItemIndex === 0) {
      nextItem = null;
    } else {
      const idx = getIndexWrap(items, currentItemIndex, ev.key === 'ArrowUp' ? -1 : 1);
      nextItem = items[idx];
    }

    setSelectedId(config.groupId, nextItem?.dataset?.navId);
    items[currentItemIndex]?.dispatchEvent(new CustomEvent('itemblur'));
    nextItem?.dispatchEvent(new CustomEvent('itemfocus'));

    scrollIntoView(scroller, nextItem, 'smooth');
  }

  function scrollContent(direction: 'up' | 'down', scroller?: HTMLElement): boolean {
    if (!scroller) return;

    scroller.scrollBy({
      top: (scroller.clientHeight / 3) * (direction === 'up' ? -1 : 1),
      behavior: 'smooth',
    });
  }

  function scrollIntoView(
    scroller?: HTMLElement,
    item?: HTMLElement,
    behavior: 'smooth' | 'auto' = 'auto'
  ): boolean {
    if (!scroller || !item) {
      return;
    }

    const rect = item.getBoundingClientRect();
    const topDiff = scroller.offsetTop - rect.top;
    const bottomDiff = rect.bottom - (scroller.offsetHeight + scroller.offsetTop);

    scroller.scrollBy({
      top: topDiff > 0 ? -topDiff : bottomDiff > 0 ? bottomDiff : 0,
      behavior,
    });

    return true;
  }

  document.addEventListener('keydown', handleKeyPress, false);

  return {
    destroy() {
      document.removeEventListener('keydown', handleKeyPress, false);
    },
    update(newConfig: Config) {
      config = newConfig;
    },
  };
}