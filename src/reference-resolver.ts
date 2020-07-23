import Ptr from "@json-schema-spec/json-pointer";

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

/**
 * Error thrown when a JSON pointer is provided but is not parseable as per the RFC6901
 *
 * @example
 * ```typescript
 *
 * import Dereferencer, { InvalidJsonPointerRefError } from "@json-schema-tools/dereferencer";
 * const dereffer = new Dereferencer({});
 * try { await dereffer.resolve(); }
 * catch(e) {
 *   if (e instanceof InvalidJsonPointerRefError) { ... }
 * }
 * ```
 *
 */
export class InvalidJsonPointerRefError implements Error {
  public name: string;
  public message: string;

  constructor(obj: any) {
    this.name = "InvalidJsonPointerRefError";
    this.message = [
      "InvalidJsonPointerRefError",
      `The provided RFC6901 JSON Pointer is invalid: ${obj.$ref}`,
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

export default (fetch: any, fs: any) => {
  const fileExistsAndReadable = (f: string): Promise<boolean> => {
    return new Promise((resolve) => {
      return fs.access(f, fs.constants.F_OK | fs.constants.R_OK, (e: any) => { //tslint:disable-line
        if (e) { return resolve(false); }
        return resolve(true);
      });
    });
  };

  const readFile = (f: string): Promise<string> => {
    return new Promise((resolve) => fs.readFile(f, "utf8", (err: any, data: any) => resolve(data)));
  };

  const resolveReference = async (ref: string, root: any): Promise<any> => {
    if (ref[0] === "#") {
      const withoutHash = ref.replace("#", "");
      try {
        const pointer = Ptr.parse(withoutHash);
        return Promise.resolve(pointer.eval(root));
      } catch (e) {
        throw new InvalidJsonPointerRefError({ $ref: ref });
      }
    }

    if (await fileExistsAndReadable(ref) === true) {
      const fileContents = await readFile(ref);
      let reffedSchema;
      try {
        reffedSchema = JSON.parse(fileContents);
      } catch (e) {
        throw new NonJsonRefError({ $ref: ref }, fileContents);
      }

      return reffedSchema;
    } else if (["$", ".", "/", ".."].indexOf(ref[0]) !== -1) {
      throw new InvalidFileSystemPathError(ref);
    }

    try {
      return await fetch(ref).then((r: any) => r.json());
    } catch (e) {
      throw new InvalidRemoteURLError(ref);
    }
  };

  return resolveReference;
};
