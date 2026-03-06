declare module 'timesync' {
  export interface TimeSyncInstance {
    now(): number;
    destroy(): void;
  }

  export interface TimeSyncOptions {
    server: string;
    interval?: number;
  }

  export function create(options: TimeSyncOptions): TimeSyncInstance;
}
