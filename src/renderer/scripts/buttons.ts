export function onClick(id: string, callback: () => void) {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', callback);
  }
}

// export function createButton(
//   label: string | HTMLElement,
//   onClick: () => void,
//   opts?: {
//     requireConfirmation?: boolean;
//   },
// ): HTMLButtonElement {
//   const button = document.createElement('ab-button');
//   // let confirmationTimeout: Timeout | null = null;
//
//   if (typeof label === 'string') {
//     button.textContent = label;
//   } else {
//     button.appendChild(label);
//   }
//
//   // button.addEventListener('click', () => {
//   //   if (opts?.requireConfirmation) {
//   //     if (button.classList.contains('warning')) {
//   //       button.classList.remove('warning');
//   //       onClick();
//   //       return;
//   //     }
//   //
//   //     if (confirmationTimeout) {
//   //       clearTimeout(confirmationTimeout);
//   //     }
//   //
//   //     button.classList.add('warning');
//   //     confirmationTimeout = setTimeout(() => button.classList.remove('warning'), 1000);
//   //   } else {
//   //     onClick();
//   //   }
//   // });
//
//   return button;
// }
