export function buttonManager(
  id: string,
  props?: { handleClick?: () => void },
): {
  enable: () => void;
  disable: () => void;
  show: () => void;
  hide: () => void;
} {
  const button = document.getElementById(id) as HTMLButtonElement;

  if (!button) {
    throw new Error(`Button with id "${id}" not found.`);
  }

  if (props?.handleClick) {
    button.addEventListener('click', props.handleClick);
  }

  return {
    enable: () => {
      button.disabled = false;
      button.classList.remove('disabled');
      if (props?.handleClick) {
        button.addEventListener('click', props.handleClick);
      }
    },
    disable: () => {
      button.disabled = true;
      button.classList.add('disabled');
      if (props?.handleClick) {
        button.removeEventListener('click', props.handleClick);
      }
    },
    show: () => {
      button.style.display = '';
    },
    hide: () => {
      button.style.display = 'none';
    },
  };
}
