# JSON Schema Reference Resolver

<center>
  <span>
    <img alt="CircleCI branch" src="https://img.shields.io/circleci/project/github/json-schema-tools/reference-resolver/master.svg">
    <img src="https://codecov.io/gh/json-schema-tools/reference-resolver/branch/master/graph/badge.svg" />
    <img alt="Dependabot status" src="https://api.dependabot.com/badges/status?host=github&repo=json-schema-tools/reference-resolver" />
    <img alt="npm" src="https://img.shields.io/npm/dt/@json-schema-tools/reference-resolver.svg" />
    <img alt="GitHub release" src="https://img.shields.io/github/release/json-schema-tools/reference-resolver.svg" />
    <img alt="GitHub commits since latest release" src="https://img.shields.io/github/commits-since/json-schema-tools/reference-resolver/latest.svg" />
  </span>
</center>

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
