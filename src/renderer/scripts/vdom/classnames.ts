/**
 * A utility function to conditionally join class names together.
 * It takes any number of arguments, which can be strings, booleans, undefined, or null.
 * It filters out falsy values and joins the remaining class names into a single string.
 *
 * Example usage:
 * c('foo', false && 'bar', undefined, null, 'baz'); // returns 'foo baz'
 *
 * @param classes - An array of class names or boolean values.
 * @returns A string of class names separated by spaces.
 */
export function c(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
