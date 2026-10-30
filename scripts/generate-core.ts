import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { compile } from "json-schema-to-typescript";
import Ajv2020 from "ajv/dist/2020.js";
import standalone from "ajv/dist/standalone/index.js";
const raw = await readFile(
  new URL("../vendor/herdr-core/schema/hc.openrpc.json", import.meta.url),
  "utf8",
);
const hash = createHash("sha256").update(raw).digest("hex");
if (hash !== "41f3e7734499e114a9a1b88f963b83823ad8383eb5e40fdacdeced2682ad92ba")
  throw Error("Pinned schema checksum mismatch");
const source = JSON.parse(raw);
function normalize(value: any): any {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== "object") return value;
  const out: any = Object.fromEntries(
    Object.entries(value).map(([key, val]) => [key, normalize(val)]),
  );
  if (out.$ref === "https://meta.open-rpc.org/")
    return {
      type: "object",
      additionalProperties: true,
      description:
        "Opaque OpenRPC document; external meta-schema is not fetched during generation.",
    };
  if (out.$ref)
    out.$ref = out.$ref.replace("#/components/schemas/", "#/$defs/");
  if (out.format === "uint64") {
    out.type =
      Array.isArray(out.type) && out.type.includes("null")
        ? ["string", "null"]
        : "string";
    out.pattern = "^(0|[1-9][0-9]*)$";
    delete out.minimum;
    delete out.format;
    out.description =
      `${out.description ?? ""} Lossless uint64: decimal string on companion boundary.`.trim();
    if (typeof out.default === "number") out.default = String(out.default);
  }
  return out;
}
const definitions = normalize(source.components.schemas);
const ajv = new Ajv2020({
  strict: false,
  allErrors: true,
  code: { source: true, esm: true },
  validateFormats: false,
});
const exports: Record<string, string> = {};
const typeProperties: Record<string, any> = {};
const schemas: Record<string, any> = {};
for (const [index, method] of source.methods.entries()) {
  const params = {
    type: "object",
    properties: Object.fromEntries(
      method.params.map((p: any) => [p.name, p.schema]),
    ),
    required: method.params
      .filter((p: any) => p.required)
      .map((p: any) => p.name),
    additionalProperties: false,
  };
  schemas[method.name] = {
    params,
    result: method.result.schema,
    errors: method.errors ?? [],
  };
  const names = [];
  for (const kind of ["params", "result"] as const) {
    const id = `core_${index}_${kind}`;
    const schema = {
      ...normalize(schemas[method.name][kind]),
      $id: id,
      $defs: definitions,
    };
    ajv.addSchema(schema, id);
    exports[id] = id;
    const name = `Method${index}${kind === "params" ? "Params" : "Result"}`;
    names.push(name);
  }
  schemas[method.name].validator = `core_${index}`;
  schemas[method.name].types = names;
  typeProperties[method.name] = {
    type: "object",
    properties: {
      params: normalize(params),
      result: normalize(method.result.schema),
    },
    required: ["params", "result"],
  };
}
const header =
  "// Generated from pinned herdr-core 0.1.14 (Apache-2.0). Do not edit.\n";
const files: Record<string, string> = {
  "types.ts":
    header +
    (await compile(
      {
        type: "object",
        properties: typeProperties,
        required: Object.keys(typeProperties),
        additionalProperties: false,
        $defs: definitions,
      },
      "CoreMethods",
      {
        bannerComment: "",
        additionalProperties: false,
        style: { singleQuote: true },
      },
    )) +
    "\nexport type MethodName = keyof CoreMethods;\n",
  "metadata.ts":
    header +
    `export const coreSchemas = ${JSON.stringify({ components: source.components, methods: schemas }, null, 2)} as const;\nexport const schemaSha256 = '${hash}';\n`,
  "validators.js": header + standalone(ajv, exports),
  "validators.d.ts":
    header +
    Object.values(exports)
      .map(
        (name) =>
          `export const ${name}: ((value: unknown) => boolean) & { errors?: unknown };`,
      )
      .join("\n") +
    "\n",
};
const directory = new URL(
  "../packages/core-client/src/generated/",
  import.meta.url,
);
await mkdir(directory, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  const path = new URL(name, directory);
  if (process.argv.includes("--check")) {
    if ((await readFile(path, "utf8")) !== content)
      throw Error(`Stale generated file: ${name}`);
  } else await writeFile(path, content);
}
console.log(
  `Verified schema ${hash}; generated ${source.methods.length} methods.`,
);
