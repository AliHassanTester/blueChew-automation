/** An async function that accepts no arguments and returns void */
export type AsyncVoidFn = () => Promise<void>;

/** Recursive partial — makes all nested properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Make specific keys required in an otherwise partial type */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Extract the resolved type of a Promise */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type StringRecord = Record<string, string>;
