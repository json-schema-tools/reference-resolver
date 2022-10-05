import defaultProtocolHandlerMap from "./default-protocol-handler-map";
import ReferenceResolver, { ProtocolHandlerMap } from "./reference-resolver";

const nodeProtocolHandlerMap: ProtocolHandlerMap = {
  ...defaultProtocolHandlerMap,
  "file": async () => undefined
};

export default new ReferenceResolver(nodeProtocolHandlerMap);
