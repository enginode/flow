import { Executable } from './executable';

/**
 * The alias of number type to indicate a process ID.
 */
export type ProcessId = number;

/**
 * The process info.
 */
export interface Process {
  /**
   * The process ID.
   */
  readonly pid: ProcessId;

  /**
   * Send the `kill` signal to the process, which stop the next schedule.
   */
  kill(): void;
}

/**
 * The assigner to assign something, like processes.
 */
export interface ScheduleAssigner {
  /**
   * Assign a number for a pid.
   */
  assign(): Promise<ProcessId>;

  /**
   * Release the room of the given number.
   *
   * @param i the used number.
   */
  release(i: ProcessId): void;
}

/**
 * The process scheduler.
 */
export class Scheduler {
  private processes: Map<ProcessId, Proc<Executable>> = new Map();

  constructor(private readonly assigner: ScheduleAssigner) {}

  /**
   * Run the executable.
   *
   * @param exe the executable.
   * @param params the parameters.
   * @returns the output.
   */
  async run<V, T>(exe: Executable<V, T>, params?: { [attr: string]: unknown }) {
    const pid = await this.assigner.assign();
    const proc = Proc.fromExecutable(pid, exe, params);
    this.processes.set(pid, proc);
    try {
      await proc.execute();
    } finally {
      this.processes.delete(pid);
      this.assigner.release(proc.pid);
    }
    const output = Array.from(exe.vars.entries())
      .filter(([, def]) => def.isOutput)
      .reduce((ret, [name]) => {
        ret[name] = proc.context.get(name);
        return ret;
      }, {} as { [attr: string]: unknown });
    return output;
  }

  /**
   * Get the scheduled process of executables.
   *
   * @returns the list of scheduled processes.
   */
  getScheduledList() {
    return this.processes;
  }
}

/**
 * Internal structure of process.
 */
class Proc<E extends Executable> {
  readonly runningTasks: Set<Promise<string[]>> = new Set();

  constructor(
    readonly pid: ProcessId,
    readonly cursors: string[],
    readonly context: Map<string, unknown>,
    readonly exe: E,
  ) {}

  /**
   * Construct a process from executable and input parameters.
   *
   * @param pid the process ID.
   * @param exe the executable.
   * @param input the input parameters.
   * @returns the process.
   */
  static fromExecutable<V, T>(pid: number, exe: Executable<V, T>, input?: { [attr: string]: unknown }) {
    return new Proc(
      pid,
      [exe.entry],
      new Map(
        Array.from(exe.vars.entries(), ([name, def]) => [
          name,
          def.type.validate(def.isInput ? input?.[name] ?? def.default : def.default),
        ]),
      ),
      exe as Executable,
    );
  }

  execute() {
    return new Promise<void>((resolve, reject) => {
      this.schedule(resolve, reject);
    });
  }

  schedule(resolve: () => void, reject: (reason: unknown) => void) {
    if (this.cursors.length === 0) {
      if (this.runningTasks.size === 0) {
        return resolve();
      } else {
        return;
      }
    }
    while (this.cursors.length > 0) {
      const cursor = this.cursors.pop()!;
      const node = this.exe.nodes.get(cursor);
      if (!node) {
        return reject(new Error(`unexpected cursor: ${cursor}`));
      }
      const executed = node.exec(node.meta, this.context);
      this.runningTasks.add(executed);
      executed.then((nextCursors) => {
        this.runningTasks.delete(executed);
        this.cursors.push(...nextCursors);
        this.schedule(resolve, reject);
      }, reject);
    }
  }

  kill() {
    this.cursors.splice(0, this.cursors.length, '~kill');
  }
}
