const chunkLodash = require('lodash.chunk');

export function chunk<T>(array: T[], chunkSize: number): T[] {
  return chunkLodash(array, chunkSize);
}
