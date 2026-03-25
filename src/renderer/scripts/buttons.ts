export function onClick(id: string, callback: (btn: HTMLButtonElement) => void) {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', () => callback(btn as HTMLButtonElement));
  }
}

export function createButton(
  label: string | HTMLElement,
  opts?: { onClick?: () => void; doubleConfirmation?: boolean },
): HTMLButtonElement {
  const button = document.createElement('button');

  if (typeof label === 'string') {
    button.textContent = label;
  } else {
    button.appendChild(label);
  }

  button.classList.add('btn', 'btn-xs');

  if (opts?.doubleConfirmation) {
    button.addEventListener('click', () => {
      const img = button.querySelector('img') as HTMLImageElement;

      if (button.classList.contains('bg-red-500')) {
        button.classList.remove('bg-red-500');
        img.classList.remove('invert');

        if (opts?.onClick) {
          opts.onClick();
        }
        return;
      }

      button.classList.add('bg-red-500');
      img.classList.add('invert');

      setTimeout(() => {
        button.classList.remove('bg-red-500');
        img.classList.remove('invert');
      }, 1000);
    });

    return button;
  }

  if (opts?.onClick) {
    button.addEventListener('click', opts.onClick);
  }

  return button;
}
