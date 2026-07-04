import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Marks dist/cli/ as ESM so Node skips the CJS-then-ESM reparse warning when
// the bundle is loaded outside its own npm install.
const cliMarker = resolve("dist/cli/package.json");
const rootPackage = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const cliPackage = {
  name: rootPackage.name ?? "reasonix-legacy",
  version: rootPackage.version ?? "0.0.0-dev",
  type: "module",
};
mkdirSync(dirname(cliMarker), { recursive: true });
writeFileSync(cliMarker, `${JSON.stringify(cliPackage, null, 2)}\n`);
console.log(`wrote ${cliMarker}`);
