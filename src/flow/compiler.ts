import { array, boolean, map, number, optional, record, string, union } from 'typescript-json-decoder';
import { exprAny, exprBoolean, exprNumber, exprString } from './builtin-expr';
import { assignment, decision, fork, request, sleep } from './builtin-nodes';
import { BooleanType, NumberType, RecordType, StringType } from './builtin-types';
import { FlowExecutable } from './executable';

export * from './executable';

const literal =
  <T>(type: string, executor: T) =>
  (v: unknown) => {
    if (v !== type) {
      throw new Error(`unexepct type: ${v}`);
    }
    return executor;
  };

/**
 * Decode the given value into a flow structure.
 */
const decodeFlow = record({
  entry: string,
  vars: map(
    union(
      record({
        name: string,
        type: literal('string', StringType),
        default: optional(string),
        isInput: boolean,
        isOutput: boolean,
      }),
      record({
        name: string,
        type: literal('boolean', BooleanType),
        default: optional(boolean),
        isInput: boolean,
        isOutput: boolean,
      }),
      record({
        name: string,
        type: literal('number', NumberType),
        default: optional(number),
        isInput: boolean,
        isOutput: boolean,
      }),
      record({
        name: string,
        type: literal('dict', RecordType),
        default: optional((v) => (typeof v === 'object' ? v : JSON.parse(string(v)))),
        isInput: boolean,
        isOutput: boolean,
      }),
    ),
    (it) => it.name,
  ),
  nodes: map(
    union(
      record({
        name: string,
        exec: literal('assignment', assignment),
        meta: record({
          assignments: array(
            record({
              name: (v) => string(v).split('.'),
              from: exprAny,
            }),
          ),
          connector: optional(string),
        }),
      }),
      record({
        name: string,
        exec: literal('decision', decision),
        meta: record({
          decisions: array(
            record({
              condition: exprBoolean,
              connector: optional(string),
            }),
          ),
          defaultConnector: optional(string),
        }),
      }),
      record({
        name: string,
        exec: literal('fork', fork),
        meta: record({
          branches: array(
            record({
              condition: optional(exprBoolean),
              connector: optional(string),
            }),
          ),
        }),
      }),
      record({
        name: string,
        exec: literal('sleep', sleep),
        meta: record({
          seconds: exprNumber,
          connector: optional(string),
        }),
      }),
      record({
        name: string,
        exec: literal('request', request),
        meta: record({
          method: optional(exprString),
          url: exprString,
          body: optional(exprString),
          outputs: optional(array({ name: (v) => string(v).split('.'), from: exprAny })),
          connector: optional(string),
        }),
      }),
    ),
    (it) => it.name,
  ),
});

/**
 * Compiler for Flow executables.
 */
export class FlowCompiler {
  /**
   * Compile the JSON string to executable.
   *
   * @param json the JSON string or JSON structure.
   * @returns the executable.
   */
  async compile(json: string | unknown): Promise<FlowExecutable> {
    return decodeFlow(typeof json === 'string' ? JSON.parse(json) : json);
  }
}
