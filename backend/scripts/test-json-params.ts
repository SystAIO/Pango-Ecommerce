/**
 * Regression test for the "Could not create product" bug.
 *
 * `pg` serialises JS arrays as Postgres array literals (`{"a","b"}`), which
 * Postgres rejects for a `jsonb` column with 22P02. The adapter now converts
 * those values to real JSON first; this test drives the exact values the admin
 * form produces through that conversion and into a real jsonb column.
 */
import { PGlite } from "@electric-sql/pglite";
import { jsonValue } from "../lib/db";
import { toProductInput } from "../lib/products";

async function main() {
  const db = new PGlite();
  await db.exec(`
    create table json_probe (
      id serial primary key,
      images jsonb not null,
      specifications jsonb not null,
      bundle_slugs jsonb not null
    );
  `);

  let failures = 0;
  const check = (label: string, pass: boolean, detail = "") => {
    console.log(`  ${pass ? "OK  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
    if (!pass) failures++;
  };

  console.log("\njsonb write path");

  for (const images of [
    ["https://pangoapparels.com/uploads/products/one.jpg"],
    [
      "https://pangoapparels.com/uploads/products/one.jpg",
      "https://pangoapparels.com/uploads/products/two.jpg",
    ],
    [],
  ]) {
    const input = toProductInput({
      name: "Probe Product",
      slug: "Probe Product",
      images,
      specifications: { Fabric: "Cotton", Fit: "Regular" },
      bundle_slugs: ["summer-combo", "winter-combo"],
    });

    const label = `${images.length} image(s)`;
    try {
      const { rows } = await db.query(
        `insert into json_probe (images, specifications, bundle_slugs)
         values ($1, $2, $3)
         returning images, specifications, bundle_slugs`,
        [jsonValue(input.images), jsonValue(input.specifications), jsonValue(input.bundle_slugs)]
      );
      const row = rows[0] as {
        images: string[];
        specifications: Record<string, string>;
        bundle_slugs: string[];
      };
      check(
        label,
        JSON.stringify(row.images) === JSON.stringify(images) &&
          row.specifications.Fabric === "Cotton" &&
          row.bundle_slugs.length === 2,
        JSON.stringify(row.images)
      );
    } catch (error) {
      check(label, false, (error as Error).message);
    }
  }

  check(
    "scalars are left untouched",
    jsonValue(42) === 42 && jsonValue(null) === null && jsonValue("x") === "x"
  );

  console.log(`\n${failures === 0 ? "JSON PARAMS OK" : `${failures} FAILED`}`);
  await db.close();
  process.exit(failures === 0 ? 0 : 1);
}

void main();
