import { BaseComponent } from './base';
import { html, css } from './types';

/****
 * Usage:
 * <ab-button id="my-button">Click me</ab-button>
 *
 * const button = document.getElementById('my-button') as HTMLElement;
 * addClickEventListenerToButton(button, () => {
 *   console.log('Button clicked!');
 * });
 *
 * Or with confirmation:
 *
 * <ab-button id="delete-button" require-confirmation="true">Delete</ab-button>
 *
 * const deleteButton = document.getElementById('delete-button') as HTMLElement;
 * addClickEventListenerToButton(deleteButton, () => {
 *   console.log('Item deleted!');
 * });
 **/
export class ABButton extends BaseComponent {
  static styles = css`
    :host(.warning) {
      ::slotted(img) {
        filter: invert(1);
      }

      button {
        background: #850202;
      }
    }

    :host([full-width]) {
      flex: 1;
      button {
        width: 100%;
      }
    }

    :host ::slotted(img) {
      width: 20px !important;
      height: 20px !important;
    }

    button {
      background-color: #ffffff;
      border: 1px solid rgb(209, 213, 219);
      border-radius: 0.5rem;
      color: #111827;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Roboto';
      line-height: 1.25rem;
      padding: 6px 15px;
      text-align: center;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: #f9fafb;
      }
    }
  `;

  static html = html` <button><slot></slot></button> `;
}

// Ensure the custom element is defined only once
if (!customElements.get('ab-button')) {
  customElements.define('ab-button', ABButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'ab-button': ABButton;
  }
}

/**
 * Utility function to create an <ab-button> element with specified content and options.
 *
 * @param content - The text or HTML content to be displayed inside the button.
 * @param opts - Optional settings for the button:
 *   - requireConfirmation: If true, the button will require a confirmation click before executing the onClick callback.
 *   - onClick: A callback function to be executed when the button is clicked.
 * @returns An HTMLElement representing the created <ab-button>.
 */
export function createButton(
  content: string | HTMLElement,
  opts?: { requireConfirmation?: boolean; onClick?: () => void; fullWidth?: boolean },
): ABButton {
  const button = document.createElement('ab-button');

  if (typeof content === 'string') {
    button.textContent = content;
  } else {
    button.appendChild(content);
  }

  if (opts?.requireConfirmation) {
    button.setAttribute('require-confirmation', 'true');
  }

  if (opts?.onClick) {
    addClickEventListenerToButton(button, opts.onClick);
  }

  if (opts?.fullWidth) {
    button.setAttribute('full-width', 'true');
  }

  return button;
}

/**
 * Adds a click event listener to an <ab-button> element that handles optional confirmation logic.
 *
 * @param abButton - The <ab-button> element to which the click event listener will be added.
 * @param callback - The function to be executed when the button is clicked and confirmed (if required).
 */
export function addClickEventListenerToButton(abButton: HTMLElement, callback: () => void) {
  const button = abButton.shadowRoot!.querySelector('button') as HTMLButtonElement;

  button.addEventListener('click', () => {
    const requiredConfirmation = abButton.getAttribute('require-confirmation') === 'true';
    if (!requiredConfirmation) {
      callback();
      return;
    }

    let confirmationTimeout: NodeJS.Timeout | null = null;

    if (abButton.classList.contains('warning')) {
      abButton.classList.remove('warning');
      callback();
      return;
    }

    if (confirmationTimeout) {
      clearTimeout(confirmationTimeout);
    }

    abButton.classList.add('warning');
    confirmationTimeout = setTimeout(() => {
      abButton.classList.remove('warning');
    }, 1000);
  });
}
