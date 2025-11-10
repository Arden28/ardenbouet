// types/markdown-it-token.d.ts
declare module "markdown-it" {
  // Minimal, but complete enough for plugin work. Add fields later if you need them.
  export interface Token {
    nesting: number;
    type: string;
    tag: string;
    attrs?: [string, string][];
    map?: [number, number];
    level: number;
    children?: Token[];
    content: string;
    markup: string;
    info: string;
    meta?: any;
    block: boolean;
    hidden: boolean;
  }
}
