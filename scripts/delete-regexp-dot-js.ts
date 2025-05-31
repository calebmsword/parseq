try {
  await Deno.remove(
    "src/http-factories/http-factories-utils/document-mock/tests/generated-files/regexp.js",
  );
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}
