import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Hook ts-node's ESM loader once so that Node can execute .ts sources directly.
register("ts-node/esm", pathToFileURL("./"));
