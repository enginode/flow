import { set } from 'lodash-es';
import { Context } from '../runtime/executable';

type Expr<T> = (ctx: Context) => T;

const ctxAssign = (ctx: Context, item: { name: string[]; from: Expr<unknown> }) => {
  const [ctxName, ...path] = item.name;
  if (path.length === 0) {
    ctx.set(ctxName, item.from(ctx));
  } else {
    set(ctx.get(ctxName) as Record<string, unknown>, path, item.from(ctx));
  }
};

export type AssignmentMeta = {
  assignments: Array<{ name: string[]; from: Expr<unknown> }>;
  connector?: string;
};
export const assignment = async (def: AssignmentMeta, ctx: Context) => {
  for (const a of def.assignments) {
    ctxAssign(ctx, a);
  }
  return def.connector ? [def.connector] : [];
};

export type DecisionMeta = {
  decisions: {
    condition: Expr<boolean>;
    connector?: string;
  }[];
  defaultConnector?: string;
};
export const decision = async (def: DecisionMeta, ctx: Context) => {
  for (const d of def.decisions) {
    if (d.condition(ctx)) {
      return d.connector ? [d.connector] : [];
    }
  }
  return def.defaultConnector ? [def.defaultConnector] : [];
};

export type ForkMeta = {
  branches: {
    condition?: Expr<boolean>;
    connector?: string;
  }[];
};
export const fork = async (def: ForkMeta, ctx: Context) => {
  return def.branches.filter((b) => (!b.condition || b.condition(ctx)) && b.connector).map((b) => b.connector!);
};

export type SleepMeta = {
  seconds: Expr<number>;
  connector?: string;
};
export const sleep = async (def: SleepMeta, ctx: Context) => {
  const seconds = def.seconds(ctx) ?? 0;
  await new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
  return def.connector ? [def.connector] : [];
};

export type RequestMeta = {
  method?: Expr<string>;
  url: Expr<string>;
  body?: Expr<string>;
  outputs?: Array<{ name: string[]; from: Expr<unknown> }>;
  connector?: string;
};
export const request = async (def: RequestMeta, ctx: Context) => {
  const resp = await fetch(def.url(ctx), {
    method: def.method?.(ctx) ?? 'GET',
    body: def.body?.(ctx),
  });
  const data = (await resp.json()) as Record<string, unknown>;
  const tmpCtx = new Map([
    ...Array.from(ctx.entries()),
    ...Object.entries(data),
    ['$out', data],
    ['$code', resp.status],
  ]);
  def.outputs?.forEach((it) => {
    ctxAssign(tmpCtx, it);
  });
  return def.connector ? [def.connector] : [];
};
