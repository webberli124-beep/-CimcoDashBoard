declare module 'css-vars-ponyfill' {
  interface CssVarsOptions {
    watch?: boolean;
    onlyLegacy?: boolean;
    silent?: boolean;
  }
  export default function cssVars(options?: CssVarsOptions): void;
}
