import buildReferenceResolver from "./reference-resolver";
import fetch from "isomorphic-fetch";

export default buildReferenceResolver(fetch, {
  access: (a: any, b: any, cb: (e: Error) => any) => cb(new Error("cant resolve file refs in a browser... yet")),
  readFile: (a: any, b: any, cb: () => any) => { return cb(); },
  constants: { F_OK: 0, R_OK: 0 } //tslint:disable-line
});
