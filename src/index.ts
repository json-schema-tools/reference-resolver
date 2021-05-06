import ReferenceResolver, { ProtocolHandlerMap } from "./reference-resolver";
import * as fs from "fs";
import { JSONSchema } from "@json-schema-tools/meta-schema";
import { InvalidRemoteURLError, NonJsonRefError } from "./errors";
import defaultProtocolHandlerMap from "./default-protocol-handler-map";

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

const nodeProtocolHandlerMap: ProtocolHandlerMap = {
  ...defaultProtocolHandlerMap,
  "file": async (uri) => {
    if (await fileExistsAndReadable(uri) === true) {
      const fileContents = await readFile(uri);
      return JSON.parse(fileContents) as JSONSchema;
    }
  }
}

export default new ReferenceResolver(nodeProtocolHandlerMap);
