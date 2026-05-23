declare module '*.svg' {
  const content: { src: string };
  export default content;
}

declare module '*.svg?raw' {
  const content: string;
  export default content;
}
