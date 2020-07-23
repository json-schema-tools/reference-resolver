# JSON Schema Reference Resolver

Takes a $ref string and a root object, and returns the referenced value.

Works in browser & in node (file system refs ignored in browser)

## Getting Started

`npm install @json-schema-tools/dereferencer`

```typescript
const referenceResolver = require("@json-schema-tools/reference-resolver").default;


referenceResolver("#/properties/foo", { properties: { foo: 123 } }); // returns '123'
referenceResolver("https://foo.com/", {}); // returns what ever json foo.com returns
referenceResolver("../my-object.json", {}); // you get teh idea

```

### Contributing

How to contribute, build and release are outlined in [CONTRIBUTING.md](CONTRIBUTING.md), [BUILDING.md](BUILDING.md) and [RELEASING.md](RELEASING.md) respectively. Commits in this repository follow the [CONVENTIONAL_COMMITS.md](CONVENTIONAL_COMMITS.md) specification.
