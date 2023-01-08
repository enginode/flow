import { Executable } from '../runtime/executable';
import { AssignmentMeta, DecisionMeta, ForkMeta, RequestMeta, SleepMeta } from './builtin-nodes';

/**
 * The definition of a flow executable.
 */
export type FlowExecutable = Executable<
  string | number | boolean | Record<string, unknown>,
  AssignmentMeta | DecisionMeta | ForkMeta | SleepMeta | RequestMeta
>;

/**
 * A helper function to define an executable in a type-safe way.
 *
 * @param exe the definition of an executable.
 * @returns the executable.
 */
export function defineFlow(exe: FlowExecutable): FlowExecutable {
  return exe;
}
