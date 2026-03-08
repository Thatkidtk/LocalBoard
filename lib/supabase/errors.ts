export function isMissingSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? error.code : undefined;
  const message = "message" in error ? error.message : undefined;

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (typeof message === "string" &&
      (message.includes("schema cache") || message.includes("does not exist")))
  );
}
