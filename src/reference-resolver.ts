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

export class CustomLoaderError implements Error {
  public name: string;
  public message: string;

  constructor(ref: string, public innerError: any) {
    this.name = "CusromLoaderError";
    this.message = [
      "CusromLoaderError",
      `Provided custom loader did not load: ${ref}`,
    ].join("\n");
  }
}

const isUrlLike = (s: string) => {
  return s.includes("://") || s.includes("localhost:");
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

interface ReferenceLoader {
  canFetch(path: string): Promise<boolean>;
  fetch(path: string): Promise<any>;
}

function createFileSystemReferenceLoader(fs: any) {
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

  return {
    canFetch: fileExistsAndReadable,
    fetch: async (path: string) => {
      const fileContents = await readFile(path);

      try {
        return JSON.parse(fileContents);
      } catch (e) {
        throw new NonJsonRefError({ $ref: path }, fileContents);
      }
    }
  };
}

function createHttpReferenceLoader(fetch: any) {
  return {
    canFetch: (path: string) => Promise.resolve(isUrlLike(path)),
    fetch: async (path: string) => {
      let fetchedContent;
      try {
        fetchedContent = await fetch(path);
        return await fetchedContent.json();
      } catch (e) {
        throw new InvalidRemoteURLError(path);
      }
    }
  };
}

function createCustomReferenceLoader(loader: (path: string) => Promise<any>): ReferenceLoader {
  return {
    canFetch: async () => true,
    fetch: async (path) => {
      try {
        return await loader(path);
      } catch (e) {
        throw new CustomLoaderError(path, e);
      }
    }
  }
}

async function loadReference(path: string, ...loaders: ReferenceLoader[]) {
  for (const loader of loaders) {
    if (await loader.canFetch(path)) {
      return await loader.fetch(path);
    }
  }

  throw new InvalidFileSystemPathError(path);
}

export default (fetch: any, fs: any) => {
  const fileSystemReferenceLoader = createFileSystemReferenceLoader(fs);
  const httpReferenceLoader = createHttpReferenceLoader(fetch);

  const resolvePointer = (ref: string, root: any): any => {
    try {
      const withoutHash = ref.replace("#", "");
      const pointer = Ptr.parse(withoutHash);
      return pointer.eval(root);
    } catch (e) {
      throw new InvalidJsonPointerRefError({ $ref: ref });
    }
  };

  /**
   * Given a $ref string, it will return the underlying pointed-to value.
   * For remote references, the root object is not used.
   */
  const resolveReference = async (ref: string, root: any, loader?: (path: string) => Promise<any>): Promise<any> => {
    if (ref[0] === "#") {
      return Promise.resolve(resolvePointer(ref, root));
    }

    const hashFragmentSplit = ref.split("#");
    let hashFragment;
    if (hashFragmentSplit.length > 1) {
      hashFragment = hashFragmentSplit[hashFragmentSplit.length - 1];
    }

    const hashlessRef = hashFragmentSplit[0];
    let reffedSchema;
    if (loader) {
      const customRefernceLoader = createCustomReferenceLoader(loader);
      reffedSchema = await loadReference(hashlessRef, customRefernceLoader);
    } else {
      reffedSchema = await loadReference(hashlessRef, fileSystemReferenceLoader, httpReferenceLoader);
    }

    if (hashFragment) {
      reffedSchema = resolvePointer(hashFragment, reffedSchema);
    }

    return reffedSchema;
  };

  return resolveReference;
};