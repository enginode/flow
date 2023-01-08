import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ArrayAssigner, DelayAssigner, FlowCompiler, Scheduler } from '../src';

const scheduler = new Scheduler(new DelayAssigner(new ArrayAssigner(100), 20, 3, (times) => times * 1000));
const compiler = new FlowCompiler();
const runExectable = async (name: string, params?: { [key: string]: unknown }) =>
  scheduler.run(
    await compiler.compile((await readFile(resolve(__dirname, 'data', `${name}.json`))).toString()),
    params,
  );

describe('flow.assignment', () => {
  it('should sum properly', async () => {
    expect((await runExectable('sum', { a: 1, b: 2 })).result).eq(3);
  });
});

describe('flow.decision', () => {
  it('should greet properly', async () => {
    const { name } = await runExectable('greeting', { name: 'Jack' });
    expect(name).eq('Hi, Jack!');
  });

  it("wouldn't reply to others than Jack.", async () => {
    const { name } = await runExectable('greeting', { name: 'Bob' });
    expect(name).eq('nothing to say.');
  });

  it('can loop back', async () => {
    const maxLoop = 1000000;
    const { n } = await runExectable('loop', { start: 0, end: maxLoop });
    expect(n).eq(maxLoop);
  });
});

describe('flow.fork', () => {
  it('should wait few seconds', async function () {
    const past = Date.now();
    const ret = await runExectable('fork', { start: 0, end: 2 });
    expect(1000 <= Date.now() - past).toBeTruthy();
    expect(ret.n).eq(2);
  });
});

describe('flow.sleep', () => {
  it('should wait few seconds', async function (t) {
    const past = Date.now();
    const data = await runExectable('sleep', { start: 0, end: 2 });
    expect(2000 <= Date.now() - past).toBeTruthy();
    expect(data.n).eq(3);
  });

  it('should run concurrently', async function () {
    const past = Date.now();
    await Promise.all([runExectable('sleep', { start: 0, end: 2 }), runExectable('sleep', { start: 0, end: 2 })]);
    expect(2000 <= Date.now() - past).toBeTruthy();
  });
});
