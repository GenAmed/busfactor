// A very small JSON Schema checker, just big enough for data/schema.json.
//
// We deliberately do not pull in a full validator library: this keeps the
// project dependency-free and the code readable. Supported keywords:
//   type, enum, required, properties, additionalProperties, items,
//   minItems, minLength, maxLength, minimum, pattern, $ref (to #/$defs/...)
// If you add a keyword to schema.json, add it here too.

export function checkSchema(schema, value) {
  const messages = [];
  walk(schema, schema, value, "$", messages);
  return messages;
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer"; // integers also count as "number" below
  return typeof value;
}

function matchesType(expected, value) {
  const actual = typeOf(value);
  if (expected === "number") return actual === "number" || actual === "integer";
  return expected === actual;
}

function walk(root, schema, value, where, messages) {
  // $ref: jump to the definition and validate against it instead.
  if (schema.$ref) {
    const target = schema.$ref.replace(/^#\//, "").split("/").reduce((o, k) => o?.[k], root);
    if (!target) return messages.push(`${where}: unknown $ref ${schema.$ref}`);
    return walk(root, target, value, where, messages);
  }

  // type: may be a single string or a list of allowed types.
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some((t) => matchesType(t, value))) {
      return messages.push(`${where}: expected ${allowed.join(" or ")}, got ${typeOf(value)}`);
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    messages.push(`${where}: value ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) messages.push(`${where}: shorter than ${schema.minLength} characters`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) messages.push(`${where}: longer than ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) messages.push(`${where}: "${value}" does not match ${schema.pattern}`);
  }

  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    messages.push(`${where}: ${value} is below minimum ${schema.minimum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) messages.push(`${where}: needs at least ${schema.minItems} item(s)`);
    if (schema.items) value.forEach((item, i) => walk(root, schema.items, item, `${where}[${i}]`, messages));
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) messages.push(`${where}: missing required field "${key}"`);
    }
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (key in value) walk(root, sub, value[key], `${where}.${key}`, messages);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in (schema.properties ?? {}))) messages.push(`${where}: unexpected field "${key}"`);
      }
    }
  }
}
