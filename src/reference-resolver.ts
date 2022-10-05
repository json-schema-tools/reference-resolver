import { JSONSchema } from "@json-schema-tools/meta-schema";
import {
  InvalidFileSystemPathError,
  NonJsonRefError,
  NotResolvableError
} from "./errors";
import resolvePointer from "./resolve-pointer";

const isUrlLike = (s: string) => {
  return s.includes("://");
}

export interface ProtocolHandlerMap {
  [protocol: string]: (uri: string, root: JSONSchema) => Promise<JSONSchema | undefined>;
}

export default class ReferenceResolver {
  constructor(public protocolHandlerMap: ProtocolHandlerMap) { }

  /**
   * Given a $ref string, it will return the underlying pointed-to value.
   * For remote references, the root object is not used.
   */
  public async resolve(ref: string, root: JSONSchema = {}): Promise<JSONSchema> {
    // Check if its an internal reference that starts from the root
    // Internal references.
    if (ref[0] === "#") {
      return Promise.resolve(resolvePointer(ref, root));
    }

    // Before we check anything else, remove everything after the hash.
    // The hash fragment, if anything, is later applied as an internal reference.
    const hashFragmentSplit = ref.split("#");
    let hashFragment;
    if (hashFragmentSplit.length > 1) {
      hashFragment = hashFragmentSplit[hashFragmentSplit.length - 1];
    }
    const hashlessRef = hashFragmentSplit[0];

    // check if its a runtime-relative filepath before anything (use the 'file')
    // protocol handler
    let relativePathSchema;
    try {
      relativePathSchema = await this.protocolHandlerMap.file(hashlessRef, root);
    } catch (e) {
      throw new NonJsonRefError({ $ref: ref }, (e as Error).message);
    }
    if (relativePathSchema !== undefined) {
      let schema: JSONSchema = relativePathSchema;
      if (hashFragment) {
        schema = resolvePointer(hashFragment, schema);
      }
      return schema;
    } else if (isUrlLike(ref) === false) {
      throw new InvalidFileSystemPathError(ref);
    }

    for (const protocol of Object.keys(this.protocolHandlerMap)) {
      if (hashlessRef.startsWith(protocol)) {
        const maybeSchema = await this.protocolHandlerMap[protocol](hashlessRef, root);

        if (maybeSchema !== undefined) {
          let schema: JSONSchema = maybeSchema;
          if (hashFragment) {
            schema = resolvePointer(hashFragment, schema);
          }
          return schema;
        }
      }
    }

    // if we get to the end and nothing has handled it yet, then we are hooped.
    throw new NotResolvableError(ref);
  }
}
