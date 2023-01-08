/**
 * The type of executable variable.
 */
export interface ExecutableVariableType<T> {
  /**
   * Validate the given value and return the normalized one.
   *
   * @param value the value to validate.
   */
  validate(value: unknown): T | undefined;
}

/**
 * The variable definition of executable.
 */
export interface ExecutableVariable<T> {
  readonly type: ExecutableVariableType<T>;
  readonly default?: T;
  readonly isInput: boolean;
  readonly isOutput: boolean;
}

/**
 * The executable node.
 */
export interface ExecutableNode<T> {
  readonly exec: (meta: T, ctx: Map<string, unknown>) => Promise<string[]>;
  readonly meta: T;
}

/**
 * The executable interface that marks an executable object.
 */
export interface Executable<V = unknown, T = unknown> {
  readonly entry: string;
  readonly vars: ReadonlyMap<string, V extends boolean ? ExecutableVariable<boolean> : ExecutableVariable<V>>;
  readonly nodes: ReadonlyMap<string, T extends unknown ? ExecutableNode<T> : never>;
}

/**
 * Type alias to Map<string, any> for better comprehension of the code.
 */
export type Context = Map<string, unknown>;
