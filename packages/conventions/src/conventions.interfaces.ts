/** One declaration at the top of a file, as the checks see it. */
export interface Declaration {
  offset: number;
  exported: boolean;
  /** A `const` holding an arrow or a `function` is a function. */
  kind: 'class' | 'function' | 'value';
  name: string;
}
