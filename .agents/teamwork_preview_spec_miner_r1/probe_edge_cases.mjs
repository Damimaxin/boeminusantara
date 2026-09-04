import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envFile = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, "utf8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([A-Z_]+)=\"?([^\r\n\"]+)\"?/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "boemi" },
});

async function runEdgeCases() {
  console.log("=== PROBING EDGE CASES ===");

  // Edge Case 1: Duplicate slug constraint
  console.log("\n[Edge Case 1] Duplicate slug insertion:");
  const testId1 = `edge-dup-${Date.now()}-1`;
  const testId2 = `edge-dup-${Date.now()}-2`;
  const dupSlug = `test-dup-slug-${Date.now()}`;
  const row1 = {
    id: testId1,
    slug: dupSlug,
    name: "Duplicate Slug 1",
    category: "tkro",
    description: "test",
    price: 1000,
    stock: 1,
    gallery: [],
  };
  const row2 = {
    id: testId2,
    slug: dupSlug,
    name: "Duplicate Slug 2",
    category: "tkro",
    description: "test",
    price: 2000,
    stock: 1,
    gallery: [],
  };

  const res1 = await sb.from("products").insert(row1);
  console.log("Insert 1 status error:", res1.error?.message || "none");
  const res2 = await sb.from("products").insert(row2);
  console.log("Insert 2 (duplicate slug) error code:", res2.error?.code, "message:", res2.error?.message);

  // Clean up
  await sb.from("products").delete().eq("id", testId1);

  // Edge Case 2: Special characters & Unicode in text fields
  console.log("\n[Edge Case 2] Special characters, quotes, emojis, symbols in name & description:");
  const testIdSpecial = `edge-spec-${Date.now()}`;
  const specialRow = {
    id: testIdSpecial,
    slug: `test-special-${Date.now()}`,
    name: `Mesin Praktik: 100% "Kualitas" & 'Presisi' (SMK #1) 🛠️`,
    category: "tkro",
    description: `Spesifikasi:\r\n- Tegangan: 220V ± 10%\r\n- Dimensi: 120 x 80 x 150 cm\r\n- Harga: Rp 50.000.000,- (Exc. PPN)\r\n- Formula: x < y & a > b | c == d`,
    price: 50000000,
    stock: 5,
    gallery: [],
  };
  const resSpec = await sb.from("products").insert(specialRow).select("*").single();
  if (resSpec.error) {
    console.log("Special chars insert error:", resSpec.error.message);
  } else {
    console.log("Special chars inserted OK. Retrieved name:", resSpec.data.name);
    console.log("Retrieved description lines:", resSpec.data.description.split("\n").length);
    await sb.from("products").delete().eq("id", testIdSpecial);
  }

  // Edge Case 3: Foreign key constraint violation on non-existent category
  console.log("\n[Edge Case 3] Non-existent category fk violation:");
  const testIdFk = `edge-fk-${Date.now()}`;
  const fkRow = {
    id: testIdFk,
    slug: `test-fk-${Date.now()}`,
    name: "FK Test Product",
    category: "non_existent_category_xyz",
    description: "test",
    price: 1000,
    stock: 1,
    gallery: [],
  };
  const resFk = await sb.from("products").insert(fkRow);
  console.log("Invalid category error code:", resFk.error?.code, "message:", resFk.error?.message);

  // Edge Case 4: Non-existent ID update and delete
  console.log("\n[Edge Case 4] Updating / Deleting non-existent ID:");
  const dummyId = "non-existent-id-999999";
  const resUpdateDummy = await sb.from("products").update({ name: "foo" }).or(`id.eq.${dummyId},slug.eq.${dummyId}`);
  console.log("Update non-existent ID error:", resUpdateDummy.error?.message || "none (PostgREST returns success with 0 modified)");
  const resDeleteDummy = await sb.from("products").delete().or(`id.eq.${dummyId},slug.eq.${dummyId}`);
  console.log("Delete non-existent ID error:", resDeleteDummy.error?.message || "none (PostgREST returns success with 0 modified)");

  // Edge Case 5: Extremely large bigint price
  console.log("\n[Edge Case 5] Bigint price bounds (e.g. 15,000,000,000 IDR):");
  const testIdBigint = `edge-bigint-${Date.now()}`;
  const bigintRow = {
    id: testIdBigint,
    slug: `test-bigint-${Date.now()}`,
    name: "High Value Trainer Bench",
    category: "tkro",
    description: "Multi-billion IDR vocational setup",
    price: 15000000000, // 15 billion IDR
    stock: 2,
    gallery: [],
  };
  const resBigint = await sb.from("products").insert(bigintRow).select("price").single();
  if (resBigint.error) {
    console.log("Bigint insert error:", resBigint.error.message);
  } else {
    console.log("Bigint price inserted and retrieved accurately:", resBigint.data.price);
    await sb.from("products").delete().eq("id", testIdBigint);
  }
}

runEdgeCases();
