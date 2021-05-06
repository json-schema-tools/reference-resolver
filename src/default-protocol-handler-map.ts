import { ProtocolHandlerMap } from "./reference-resolver";
import { InvalidRemoteURLError, NonJsonRefError } from "./errors";
import { JSONSchema } from "@json-schema-tools/meta-schema";
import fetch from "isomorphic-fetch";

const fetchHandler = async (uri: string): Promise<JSONSchema> => {
  let schemaReq;
  try {
    schemaReq = await fetch(uri);
  } catch (e) {
    throw new InvalidRemoteURLError(uri);
  }

  try {
    return await schemaReq.json() as JSONSchema;
  } catch (e) {
    throw new NonJsonRefError({ $ref: uri }, e.message);
  }
};

export default {
  "https": fetchHandler,
  "http": fetchHandler,
} as ProtocolHandlerMap;
