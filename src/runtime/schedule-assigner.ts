import { ProcessId, ScheduleAssigner } from './scheduler';

/**
 * A simple assigner implemented in array.
 */
export class ArrayAssigner implements ScheduleAssigner {
  private readonly pool: Array<boolean | null>;

  constructor(maxLen: number) {
    this.pool = new Array(maxLen);
  }

  async assign() {
    const idx = this.pool.findIndex((p) => !p);
    if (idx < 0) {
      throw new Error('No room to assign');
    }
    this.pool[idx] = true;
    return idx;
  }

  release(i: ProcessId) {
    this.pool[i] = null;
  }
}

/**
 * The delay assigner which supports pending and retries.
 */
export class DelayAssigner implements ScheduleAssigner {
  protected pendingItems = 0;

  constructor(
    private assigner: ScheduleAssigner,
    readonly maxPendingItems: number,
    readonly maxRetryTimes: number,
    readonly computeDelay: (times: number) => number,
  ) {}

  async assign() {
    if (this.pendingItems > this.maxPendingItems) {
      throw new Error('exceeds max pending items');
    }
    this.pendingItems++;
    try {
      return await this.delayAssign(1);
    } catch (err) {
      throw err;
    } finally {
      this.pendingItems--;
    }
  }

  protected async delayAssign(times: number): Promise<number> {
    try {
      return await this.assigner.assign();
    } catch (err) {
      if (times > this.maxRetryTimes) {
        throw new Error('exceeds max retry times');
      }
      return new Promise((resolve, reject) =>
        setTimeout(
          () =>
            this.delayAssign(times + 1)
              .then(resolve)
              .catch(reject),
          this.computeDelay(times),
        ),
      );
    }
  }

  release(i: ProcessId) {
    return this.assigner.release(i);
  }
}
