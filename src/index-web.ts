import buildReferenceResolver from "./reference-resolver";
import fetch from "isomorphic-fetch";

export default buildReferenceResolver(fetch, {
  access: () => Promise.resolve(false),
  readFile: () => Promise.resolve(""),
  constants: { F_OK: 0, R_OK: 0 } //tslint:disable-line
});
