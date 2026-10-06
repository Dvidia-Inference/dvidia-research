import { mkdir, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectTopics, REPOSITORY, ROOT } from "./validate.mjs";

try {
  const topics = await collectTopics();
  const catalog = { schemaVersion: 1, repository: REPOSITORY, topics };
  const serialized = `${JSON.stringify(catalog, null, 2)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > 1000000)
    throw new Error(
      "Catalog exceeds the static browser's 1 MB limit. Keep topic metadata concise.",
    );
  const output = resolve(ROOT, "docs/topics.json");
  await mkdir(resolve(ROOT, "docs"), { recursive: true });
  await writeFile(`${output}.tmp`, serialized, "utf8");
  await rename(`${output}.tmp`, output);
  console.log(
    `Built docs/topics.json from ${topics.length} validated topic folders.`,
  );
} catch (error) {
  console.error(`Catalog build failed: ${error.message}`);
  process.exitCode = 1;
}
