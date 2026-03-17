import { html, css, IBaseComponentConstructor } from './types';

export class BaseComponent extends HTMLElement {
  static styles = css``;
  static html = html``;

  constructor() {
    super();

    const ctor = this.constructor as IBaseComponentConstructor;

    const shadowRoot = this.attachShadow({ mode: 'open' });

    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(ctor.styles);

    shadowRoot.adoptedStyleSheets = [stylesheet];
    shadowRoot.innerHTML = ctor.html;
  }
}
