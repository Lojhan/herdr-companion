import { parse, stringify } from "lossless-json";
import { coreSchemas } from "./generated/metadata.js";
import * as validators from "./generated/validators.js";
import type { MethodName } from "./generated/types.js";
type Schema = {
  $ref?: string;
  format?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  additionalProperties?: Schema | boolean;
  anyOf?: Schema[];
};
export function parseCore(text: string): any {
  return parse(text, undefined, (value: string) =>
    /^-?\d+$/.test(value) && !Number.isSafeInteger(Number(value))
      ? BigInt(value)
      : Number(value),
  );
}
export function stringifyCore(value: unknown): string {
  return stringify(value)!;
}
export function transform(value: any, schema: Schema, outbound = false): any {
  if (value == null || typeof schema !== "object") return value;
  if (schema.$ref?.startsWith("#/components/schemas/"))
    return transform(
      value,
      (coreSchemas.components.schemas as unknown as Record<string, Schema>)[
        schema.$ref.split("/").at(-1)!
      ]!,
      outbound,
    );
  if (schema.format === "uint64") {
    if (outbound) {
      if (
        typeof value !== "string" ||
        !/^(0|[1-9][0-9]*)$/.test(value) ||
        BigInt(value) > 18446744073709551615n
      )
        throw Error("Invalid uint64");
      return BigInt(value);
    }
    if (
      (typeof value !== "number" && typeof value !== "bigint") ||
      (typeof value === "number" && !Number.isSafeInteger(value)) ||
      BigInt(value) < 0n ||
      BigInt(value) > 18446744073709551615n
    )
      throw Error("Invalid uint64");
    return String(value);
  }
  if (schema.anyOf) {
    const variant = schema.anyOf.find((s) => s.$ref || s.properties);
    return variant ? transform(value, variant, outbound) : value;
  }
  if (Array.isArray(value) && schema.items)
    return value.map((item) => transform(item, schema.items!, outbound));
  if (typeof value === "object" && !Array.isArray(value))
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        transform(
          val,
          schema.properties?.[key] ??
            (typeof schema.additionalProperties === "object"
              ? schema.additionalProperties
              : {}),
          outbound,
        ),
      ]),
    );
  return value;
}
export function validate(
  method: MethodName,
  kind: "params" | "result",
  value: unknown,
): void {
  const name = `${coreSchemas.methods[method].validator}_${kind}`;
  const validator = (validators as Record<string, (value: unknown) => boolean>)[
    name
  ]!;
  if (!validator(value)) {
    const errors = (validator as any).errors;
    throw Error(
      `Invalid core ${kind} for ${method}: ${JSON.stringify(errors?.map((error: any) => ({ path: error.instancePath, keyword: error.keyword, params: error.params })))}`,
    );
  }
}
export function methodSchema(
  method: MethodName,
  kind: "params" | "result",
): Schema {
  return coreSchemas.methods[method][kind] as Schema;
}
export function decodeResult<M extends MethodName>(
  method: M,
  value: unknown,
): import("./generated/types.js").CoreMethods[M]["result"] {
  const result = transform(value, methodSchema(method, "result"));
  validate(method, "result", result);
  return result;
}
