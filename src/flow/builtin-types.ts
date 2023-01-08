/**
 * The convenient class to define types.
 */
class BaseType<T> {
  constructor(readonly validate: (value: unknown) => T | undefined) {}
}
/**
 * The string type.
 */

export const StringType = new BaseType((value) => {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toString !== 'function') {
      throw new Error('not a string!');
    }
    return `${obj.toString()}`;
  }
  return value;
});
/**
 * The number type.
 */

export const NumberType = new BaseType((value) => {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number') {
    return parseFloat(StringType.validate(value)!);
  }
  return value;
});
/**
 * The boolean type.
 */

export const BooleanType = new BaseType((value) => {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new Error('not a boolean!');
  }
  return value;
});

export const RecordType = new BaseType((value) => {
  if (typeof value === 'undefined' || !value) {
    return undefined;
  }
  if (typeof value !== 'object') {
    throw new Error('not an object');
  }
  return value as Record<string, unknown>;
});
