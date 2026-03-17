export const html = String.raw;
export const css = String.raw;

export interface IBaseComponentConstructor extends Function {
  styles: string;
  html: string;
}
