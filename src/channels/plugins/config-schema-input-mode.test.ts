import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  CHANNEL_CONFIG_TO_JSON_SCHEMA_OPTIONS,
  convertChannelConfigSchemaToJsonInput,
} from "./config-schema-input-mode.js";

describe("CHANNEL_CONFIG_TO_JSON_SCHEMA_OPTIONS", () => {
  it("uses draft-07 with input semantics so defaulted optionals are not required (#77116)", () => {
    expect(CHANNEL_CONFIG_TO_JSON_SCHEMA_OPTIONS).toEqual({
      target: "draft-07",
      unrepresentable: "any",
      io: "input",
    });
  });
});

describe("convertChannelConfigSchemaToJsonInput", () => {
  it("returns null when the supplied schema does not expose toJSONSchema", () => {
    const legacy = {} as unknown as Parameters<typeof convertChannelConfigSchemaToJsonInput>[0];
    expect(convertChannelConfigSchemaToJsonInput(legacy)).toBeNull();
  });

  it("forwards the shared input-mode options to the underlying converter", () => {
    const toJSONSchema = vi.fn(() => ({ type: "object" }));
    const schema = { toJSONSchema } as unknown as Parameters<
      typeof convertChannelConfigSchemaToJsonInput
    >[0];
    convertChannelConfigSchemaToJsonInput(schema);
    expect(toJSONSchema).toHaveBeenCalledWith(CHANNEL_CONFIG_TO_JSON_SCHEMA_OPTIONS);
  });

  it("omits .optional().default(X) fields from required (regression for Feishu crash loop)", () => {
    const schema = z.object({
      mandatory: z.string(),
      optionalWithDefault: z.string().optional().default("seed"),
      pureOptional: z.string().optional(),
    });
    const json = convertChannelConfigSchemaToJsonInput(schema);
    expect(json).toMatchObject({
      type: "object",
      required: ["mandatory"],
    });
  });
});
