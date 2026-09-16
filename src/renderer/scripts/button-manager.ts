export function buttonManager(
  id: string,
  props?: { handleClick?: () => void; onHoldClick?: () => void },
): {
  enable: () => void;
  disable: () => void;
  show: () => void;
  hide: () => void;
} {
  const button = document.getElementById(id) as HTMLButtonElement;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let longPress = false;
  let suppressClick = false;

  if (!button) {
    throw new Error(`Button with id "${id}" not found.`);
  }

  if (props?.handleClick) {
    button.addEventListener('click', (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
        return;
      }
      props!.handleClick!();
    });
  }

  if (props?.onHoldClick) {
    button.addEventListener('pointerdown', () => {
      longPress = false;
      holdTimer = setTimeout(() => {
        longPress = true;
        suppressClick = true;
        props!.onHoldClick!();
      }, 1000);
    });

    button.addEventListener('pointerup', (event) => {
      clearTimeout(holdTimer);
      if (longPress) {
        event.preventDefault();
      }
    });
  }

  return {
    enable: () => {
      button.disabled = false;
      button.classList.remove('disabled');
    },
    disable: () => {
      button.disabled = true;
      button.classList.add('disabled');
    },
    show: () => {
      button.style.display = '';
    },
    hide: () => {
      button.style.display = 'none';
    },
  };
}
