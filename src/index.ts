import ReferenceResolver, { ProtocolHandlerMap } from "./reference-resolver";
import * as fs from "fs";
import { JSONSchema, JSONSchemaObject } from "@json-schema-tools/meta-schema";
import defaultProtocolHandlerMap from "./default-protocol-handler-map";
import path from "path";

const fileExistsAndReadable = (f: string): Promise<boolean> => {
  return new Promise((resolve) => {
    return fs.access(f, fs.constants.F_OK | fs.constants.R_OK, (e: any) => {
      if (e) { return resolve(false); }
      return resolve(true);
    });
  });
};

const readFile = (f: string): Promise<string> => {
  return new Promise((resolve) => fs.readFile(f, "utf8", (err: any, data: any) => resolve(data)));
};

const nodeProtocolHandlerMap: ProtocolHandlerMap = {
  ...defaultProtocolHandlerMap,
  file: async (uri, root: JSONSchema): Promise<JSONSchema | undefined> => {
    let filePath = uri;
    const ref = (root as JSONSchemaObject).$ref;
    if (ref && ref !== uri && await fileExistsAndReadable(ref)) {
      filePath = `${path.parse(ref).dir}/${uri}`;
    }

    if (await fileExistsAndReadable(filePath) === true) {
      const fileContents = await readFile(filePath);
      return JSON.parse(fileContents) as JSONSchema;
    }

    return;
  },
}

export default new ReferenceResolver(nodeProtocolHandlerMap);
