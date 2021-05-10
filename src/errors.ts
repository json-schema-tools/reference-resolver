/**
 * Error thrown when the fetched reference is not properly formatted JSON or is encoded
 * incorrectly
 *
 * @example
 * ```typescript
 *
 * import Dereferencer, { NonJsonRefError } from "@json-schema-tools/dereferencer";
 * const dereffer = new Dereferencer({});
 * try { await dereffer.resolve(); }
 * catch(e) {
 *   if (e instanceof NonJsonRefError) { ... }
 * }
 * ```
 *
 */
export class NonJsonRefError implements Error {
  public message: string;
  public name: string;

  constructor(obj: any, nonJson: string) {
    this.name = "NonJsonRefError";
    this.message = [
      "NonJsonRefError",
      `The resolved value at the reference: ${obj.$ref} was not JSON.parse 'able`,
      `The non-json content in question: ${nonJson}`,
    ].join("\n");
  }
}


export class NotResolvableError implements Error {
  public message: string;
  public name: string;

  constructor(ref: string) {
    this.name = "NotResolvableError";
    this.message = [
      "NotResolvableError",
      `Could not resolve the reference: ${ref}`,
      `No protocol handler was found, and it was not found to be an internal reference`,
    ].join("\n");
  }
}

/**
 * Error thrown when given an invalid file system path as a reference.
 *
 */
export class InvalidRemoteURLError implements Error {
  public message: string;
  public name: string;

  constructor(ref: string) {
    this.name = "InvalidRemoteURLError";
    this.message = [
      "InvalidRemoteURLError",
      `The url was not resolvable: ${ref}`,
    ].join("\n");
  }
}

/**
 * Error thrown when given an invalid file system path as a reference.
 *
 * @example
 * ```typescript
 *
 * import Dereferencer, { InvalidFileSystemPathError } from "@json-schema-tools/dereferencer";
 * const dereffer = new Dereferencer({});
 * try { await dereffer.resolve(); }
 * catch(e) {
 *   if (e instanceof InvalidFileSystemPathError) { ... }
 * }
 * ```
 *
 */
export class InvalidFileSystemPathError implements Error {
  public name: string;
  public message: string;

  constructor(ref: string) {
    this.name = "InvalidFileSystemPathError";
    this.message = [
      "InvalidFileSystemPathError",
      `The path was not resolvable: ${ref}`,
    ].join("\n");
  }
}
