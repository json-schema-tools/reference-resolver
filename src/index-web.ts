import buildReferenceResolver from "./reference-resolver";
import fetch from "isomorphic-fetch";

export default buildReferenceResolver(fetch, {
  access: () => Promise.resolve(false),
  readFile: () => Promise.resolve(""),
});
