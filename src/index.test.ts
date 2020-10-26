import referenceResolver from "./index";
import { NonJsonRefError, InvalidJsonPointerRefError, InvalidFileSystemPathError, InvalidRemoteURLError } from "./reference-resolver";

describe("referenceResolver", () => {

  it("simple", async () => {
    const resolvedRef = await referenceResolver("#/properties/foo", { properties: { foo: "boo" } });
    expect(resolvedRef).toBe("boo");
  });

  it("file", async () => {
    const resolvedRef = await referenceResolver("./src/test-obj.json", {});
    expect(resolvedRef).toEqual({ type: "string" });
  });

  it("https uri", async () => {
    const resolvedRef = await referenceResolver(
      "https://raw.githubusercontent.com/json-schema-tools/meta-schema/master/src/schema.json",
      {},
    );
    expect(resolvedRef.title).toBe("JSONSchema");
  });

  it("errors on non-json", async () => {
    expect.assertions(1);
    try {
      await referenceResolver("./src/test-non-json.json", {});
    } catch (e) {
      expect(e).toBeInstanceOf(NonJsonRefError);
    }
  });

  it("errors on bad json pointer ref", async () => {
    expect.assertions(1);
    try {
      await referenceResolver("#/nope", { foo: { bar: true } });
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidJsonPointerRefError);
    }
  });

  it("errors if file cant be found", async () => {
    expect.assertions(1);
    try {
      await referenceResolver("../not-real-file", {});
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidFileSystemPathError);
    }
  });

  it("files are not relative to the src folder", async () => {
    expect.assertions(1);
    try {
      await referenceResolver("test-schema-1.json", {});
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidFileSystemPathError);
    }
  });

  it("files are relative to the folder the script is run from (in this case, project root)", async () => {
    expect.assertions(1);
    const reffed = await referenceResolver("src/test-schema-1.json", {});
    expect(reffed).toBeDefined();
  });

  it("works with nested folders when using relative file path & no prefixing", async () => {
    expect.assertions(1);
    const resolved = await referenceResolver("nestedtest/test-schema-1.json", {});
    expect(resolved.$ref).toBe("./src/test-schema.json");
  });

  it("errors on urls that arent real", async () => {
    expect.assertions(1);
    try {
      await referenceResolver("https://not.real.at.all", {});
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidRemoteURLError);
    }
  });

  it("errors on urls that dont return json", async () => {
    expect.assertions(1);
    try {
      await referenceResolver("https://open-rpc.org/", {});
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidRemoteURLError);
    }
  });
});