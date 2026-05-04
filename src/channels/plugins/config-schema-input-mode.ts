import type { ZodTypeAny } from "zod";
import type { JsonSchemaObject } from "../../shared/json-schema.types.js";

type ZodSchemaWithToJsonSchema = ZodTypeAny & {
  toJSONSchema?: (params?: Record<string, unknown>) => unknown;
};

/**
 * JSON Schema conversion options used for runtime channel config validation.
 *
 * Zod 4's `toJSONSchema()` defaults to `io: 'output'`, which marks
 * `.optional().default(X)` fields as `required` because the output type
 * always carries a value. The runtime config validator validates user
 * *input* (Ajv with `useDefaults: false`) against the generated schema,
 * so `required` must reflect input requirements — defaulted optional
 * fields must remain omittable. Without `io: 'input'`, pre-existing
 * channel configs crash the gateway in a restart loop after upgrade
 * because previously omittable fields are suddenly demanded (#77116).
 */
export const CHANNEL_CONFIG_TO_JSON_SCHEMA_OPTIONS = {
  target: "draft-07",
  unrepresentable: "any",
  io: "input",
} as const;

/**
 * Converts a Zod channel config schema to a JSON Schema using input
 * semantics. Returns `null` when the supplied schema does not expose
 * `toJSONSchema()` (Zod v3 plugin compatibility fallback).
 */
export function convertChannelConfigSchemaToJsonInput(schema: ZodTypeAny): JsonSchemaObject | null {
  const schemaWithJson = schema as ZodSchemaWithToJsonSchema;
  if (typeof schemaWithJson.toJSONSchema !== "function") {
    return null;
  }
  return schemaWithJson.toJSONSchema(CHANNEL_CONFIG_TO_JSON_SCHEMA_OPTIONS) as JsonSchemaObject;
}
