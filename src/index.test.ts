import { JSONSchema, JSONSchemaObject } from "@json-schema-tools/meta-schema";
import { InvalidFileSystemPathError, InvalidRemoteURLError, NonJsonRefError } from "./errors";
import referenceResolver from "./index";
import { InvalidJsonPointerRefError } from "./resolve-pointer";

describe("referenceResolver", () => {

  it("simple", async () => {
    const resolvedRef = await referenceResolver.resolve("#/properties/foo", { properties: { foo: "boo" } });
    expect(resolvedRef).toBe("boo");
  });

  it("file", async () => {
    const resolvedRef = await referenceResolver.resolve("./src/test-obj.json");
    expect(resolvedRef).toEqual({ type: "string" });
  });

  it("https uri", async () => {
    const uri = "https://meta.json-schema.tools";
    const resolvedRef = await referenceResolver.resolve(uri) as JSONSchemaObject;

    expect(resolvedRef.title).toBe("JSONSchema");
  });

  it("errors on non-json", async () => {
    expect.assertions(1);
    try {
      await referenceResolver.resolve("./src/test-non-json.json");
    } catch (e) {
      expect(e).toBeInstanceOf(NonJsonRefError);
    }
  });

  it("errors on bad json pointer ref", async () => {
    expect.assertions(1);
    try {
      await referenceResolver.resolve("#/nope", { foo: { bar: true } });
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidJsonPointerRefError);
    }
  });

  it("errors if file cant be found", async () => {
    expect.assertions(1);
    try {
      await referenceResolver.resolve("../not-real-file");
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidFileSystemPathError);
    }
  });

  it("files are not relative to the src folder", async () => {
    expect.assertions(1);
    try {
      await referenceResolver.resolve("test-schema-1.json");
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidFileSystemPathError);
    }
  });

  it("files are relative to the folder the script is run from (in this case, project root)", async () => {
    expect.assertions(1);
    const reffed = await referenceResolver.resolve("src/test-schema-1.json");
    expect(reffed).toBeDefined();
  });

  it("works with nested folders when using relative file path & no prefixing", async () => {
    expect.assertions(1);
    const resolved = await referenceResolver
      .resolve("nestedtest/test-schema-1.json") as JSONSchemaObject;
    expect(resolved.$ref).toBe("./src/test-schema.json");
  });

  it("errors on urls that arent real", async () => {
    expect.assertions(1);
    try {
      await referenceResolver.resolve("https://not.real.at.all");
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidRemoteURLError);
    }
  });

  it("errors on urls that dont return json", async () => {
    expect.assertions(1);
    try {
      await referenceResolver.resolve("https://open-rpc.org/");
    } catch (e) {
      expect(e).toBeInstanceOf(NonJsonRefError);
    }
  });
});


describe("refs with hash fragment / internal reference component", () => {
  describe("files", () => {
    it("works in simple case", async () => {
      expect(await referenceResolver.resolve("./src/test-obj.json#/type"))
        .toBe("string");
    });

    it("errors when the json pointer is invalid", async () => {
      expect.assertions(1);
      try {
        await referenceResolver.resolve("./src/test-obj.json#balony");
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJsonPointerRefError);
      }
    });
  });

  describe("urls", () => {
    it("works with forward slashes surrounding the hash", async () => {
      expect(await referenceResolver.resolve("https://meta.open-rpc.org/#/type")).toBe("object");
    });
    it("works without slash infront of hash, but with one after", async () => {
      expect(await referenceResolver.resolve("https://meta.open-rpc.org#/type")).toBe("object");
    });

    it("errors when the json pointer is invalid", async () => {
      expect.assertions(1);
      try {
        await referenceResolver.resolve("https://meta.open-rpc.org/#type");
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJsonPointerRefError);
      }
    });

    it("errors when you have 2 hash fragments in 1 ref", async () => {
      expect.assertions(1);
      try {
        await referenceResolver.resolve("https://meta.open-rpc.org/#properties/#openrpc", {});
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidJsonPointerRefError);
      }
    });
  });
});


describe("adding custom protocol handlers", () => {
  it("has a way to add ipfs", () => {
    referenceResolver.protocolHandlerMap.ipfs = () => {
      // pretend like we are doing ipfs things here
      const fetchedFromIpfs = { title: "foo", type: "string" } as JSONSchema;
      return Promise.resolve(fetchedFromIpfs);
    };

    referenceResolver.resolve("ipfs://80088008800880088008")
  });
});
