/**
 * Turns a nested dictionary type into a union of dot-separated key paths,
 * e.g. "common.actions.save". Gives compile-time safety for `t(...)`.
 */
export type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`
}[keyof T & string]
