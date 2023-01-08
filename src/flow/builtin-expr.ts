import { compile as compileExpr } from 'expression-eval';
import { boolean, number, string } from 'typescript-json-decoder';
import { Context } from '../runtime/executable';

/**
 * The builtin context.
 */
const builtinCtx: { [key: string]: unknown } = {
  JSON,
  Math,
};

/**
 * Evaluate the expression string into contextual result.
 *
 * @param expr the expression string to evaluate.
 * @returns the evaluator function.
 */
export const exprAny = (expr: unknown) => {
  const fn = compileExpr(string(expr));
  return (ctx: Context) =>
    fn(
      new Proxy(ctx, {
        get(target, p) {
          if (typeof p === 'symbol') {
            throw new Error('symbols are not supported');
          }
          if (target.has(p)) {
            return target.get(p);
          }
          return builtinCtx[p];
        },
      }),
    ) as unknown;
};

/**
 * The high order function (decorator) to return a type-safe expression evaluator.
 *
 * @param convertFn the convertion function.
 * @returns the typed expression evaluator.
 */
export const exprType = <T>(convertFn: (v: unknown) => T) => {
  return (expr: unknown) => {
    const fn = exprAny(expr);
    return (ctx: Context) => convertFn(fn(ctx));
  };
};

/**
 * Evaluate the expression string into string result.
 *
 * @param expr the expression string to evaluate.
 * @returns the evaluator function.
 */
export const exprString = exprType(string);

/**
 * Evaluate the expression string into number result.
 *
 * @param expr the expression string to evaluate.
 * @returns the evaluator function.
 */
export const exprNumber = exprType(number);

/**
 * Evaluate the expression string into boolean result.
 *
 * @param expr the expression string to evaluate.
 * @returns the evaluator function.
 */
export const exprBoolean = exprType(boolean);
