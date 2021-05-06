import Ptr from "@json-schema-spec/json-pointer";

/**
 * Error thrown when a JSON pointer is provided but is not parseable as per the RFC6901
 *
 */
export class InvalidJsonPointerRefError implements Error {
  public name: string;
  public message: string;

  constructor(ref: string, additionalMsg: string) {
    this.name = "InvalidJsonPointerRefError";
    this.message = [
      "InvalidJsonPointerRefError",
      `The provided RFC6901 JSON Pointer is invalid: ${ref}`,
      "",
      "addition info: ",
      additionalMsg,
    ].join("\n");
  }
}

export default (ref: string, root: any): any => {
  try {
    const withoutHash = ref.replace("#", "");
    const pointer = Ptr.parse(withoutHash);
    return pointer.eval(root);
  } catch (e) {
    throw new InvalidJsonPointerRefError(ref, e.message);
  }
};
