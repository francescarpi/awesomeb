import { BaseComponent } from './base';
import { html, css } from './types';

export class ABInput extends BaseComponent {
  static styles = css`
    :host {
    }

    input {
      outline: none;
      padding: 3px 10px;
      border-radius: 8px;
      font-size: 0.875rem;
      box-shadow: 1px 1px 1px 1px #000000;
      border: 1px solid #000000;
    }
  `;
  static html = html`<input />`;

  set placeholder(value: string) {
    const input = this.shadowRoot!.querySelector('input')!;
    input.setAttribute('placeholder', value);
  }

  focus() {
    const input = this.shadowRoot!.querySelector('input')!;
    input.focus();
  }
}

// Ensure the custom element is defined only once
if (!customElements.get('ab-input')) {
  customElements.define('ab-input', ABInput);
}

declare global {
  interface HTMLElementTagNameMap {
    'ab-input': ABInput;
  }
}
