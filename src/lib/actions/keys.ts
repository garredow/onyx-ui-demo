type Config = {
  disabled?: boolean;
  longPressAction?: 'action' | 'repeat';
  priority?: 'high' | 'default';
  onArrowUp?: () => Promise<boolean> | boolean;
  onArrowUpLong?: () => Promise<boolean> | boolean;
  onArrowDown?: () => Promise<boolean> | boolean;
  onArrowDownLong?: () => Promise<boolean> | boolean;
  onArrowLeft?: () => Promise<boolean> | boolean;
  onArrowLeftLong?: () => Promise<boolean> | boolean;
  onArrowRight?: () => Promise<boolean> | boolean;
  onArrowRightLong?: () => Promise<boolean> | boolean;
  onEnter?: () => Promise<boolean> | boolean;
  onEnterLong?: () => Promise<boolean> | boolean;
  onSoftLeft?: () => Promise<boolean> | boolean;
  onSoftLeftLong?: () => Promise<boolean> | boolean;
  onSoftRight?: () => Promise<boolean> | boolean;
  onSoftRightLong?: () => Promise<boolean> | boolean;
  onBackspace?: () => Promise<boolean> | boolean;
  onBackspaceLong?: () => Promise<boolean> | boolean;
};

export function keys(node: HTMLElement, config: Config) {
  async function handleKeyPress(ev: KeyboardEvent, key: string, longPress = false) {
    const handler = config[`on${key}${longPress ? 'Long' : ''}`];
    const handled = await handler?.();

    if (handled) {
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      ev.preventDefault();
    }
  }

  function parseKey(ev: KeyboardEvent): string {
    // Simulate soft keys for testing purposes
    if (ev.shiftKey && ev.key === 'ArrowLeft') {
      return 'SoftLeft';
    }
    if (ev.shiftKey && ev.key === 'ArrowRight') {
      return 'SoftRight';
    }
    return ev.key;
  }

  function validateEvent(ev: KeyboardEvent) {
    const key = parseKey(ev);

    const dpadKeys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Enter',
      'Backspace',
      'SoftLeft',
      'SoftRight',
    ];

    let valid = true;
    const target = ev.target as HTMLElement | null;
    if (
      config.disabled ||
      !dpadKeys.includes(key) ||
      (!['SoftLeft', 'SoftRight', 'Enter'].includes(key) &&
        target?.tagName.toLowerCase() === 'input') ||
      (!['SoftLeft', 'SoftRight', 'Enter'].includes(key) &&
        (target?.attributes as any).role?.value === 'textbox') ||
      ev.repeat
    ) {
      valid = false;
    }

    return { key, valid };
  }

  let timer;
  let handled = false;
  function handleKeyDown(ev: KeyboardEvent) {
    const { key, valid } = validateEvent(ev);
    if (!valid) return;
    handled = false;
    timer = setTimeout(() => {
      handled = true;
      handleKeyPress(ev, key, true);
    }, 500);
  }
  function handleKeyUp(ev: KeyboardEvent) {
    const { key, valid } = validateEvent(ev);
    if (!valid) return;
    clearTimeout(timer);
    if (!handled) handleKeyPress(ev, key, false);
  }

  document.addEventListener('keydown', handleKeyDown, config.priority === 'high');
  document.addEventListener('keyup', handleKeyUp, config.priority === 'high');

  return {
    destroy() {
      document.removeEventListener('keydown', handleKeyDown, config.priority === 'high');
      document.removeEventListener('keyup', handleKeyUp, config.priority === 'high');
    },
    update(newConfig: Config) {
      config = newConfig;
    },
  };
}