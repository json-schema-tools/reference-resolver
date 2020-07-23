import buildReferenceResolver from "./reference-resolver";
import fetch from "isomorphic-fetch";
import * as fs from "fs";

export default buildReferenceResolver(fetch, fs);
