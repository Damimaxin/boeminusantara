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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "boemi" },
});

// Helper simulating toDbRow exactly as in lib/admin/products.ts
function isVideoLink(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  return (
    u.includes("youtube.com") ||
    u.includes("youtu.be") ||
    u.includes("vimeo.com") ||
    u.endsWith(".mp4") ||
    u.endsWith(".webm") ||
    u.endsWith(".mov")
  );
}

function toDbRow(input, generateId = false) {
  const galleryList =
    Array.isArray(input.images) && input.images.length > 0
      ? input.images.filter(Boolean)
      : input.image
      ? [input.image]
      : [];

  if (input.video && input.video.trim()) {
    const cleanVid = input.video.trim();
    if (!galleryList.includes(cleanVid)) {
      galleryList.push(cleanVid);
    }
  }

  const catCode = (input.category || "gen").toLowerCase().replace(/[^a-z0-9]/g, "");
  const slugClean = (input.slug || "prod").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);

  const row = {
    slug: input.slug,
    name: input.name,
    category: input.category,
    description: input.description,
    price: input.price,
    stock: input.stock,
    image: input.image || null,
    gallery: galleryList,
    active: input.active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (generateId) {
    row.id = `boemi-${catCode}-${slugClean}-${Date.now().toString(36)}`;
  }

  if (input.sku) row.sku = input.sku;
  if (input.brand) row.brand = input.brand;

  return row;
}

function fromRow(r) {
  const rawGallery = Array.isArray(r.gallery)
    ? r.gallery
    : Array.isArray(r.images)
    ? r.images
    : [];

  const videoItem = rawGallery.find((g) => isVideoLink(g));
  const imagesList = rawGallery.filter((g) => g !== videoItem);

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    price: r.price,
    stock: r.stock,
    image: r.image,
    images: imagesList,
    video: videoItem || r.video || null,
    active: r.active ?? true,
    sku: r.sku,
    brand: r.brand,
  };
}

async function testLifecycle() {
  console.log("=== TESTING FULL CRUD LIFECYCLE ON boemi.products ===");

  const timestamp = Date.now();
  const testInput = {
    slug: `test-crud-lifecycle-${timestamp}`,
    name: `Test CRUD Lifecycle Product ${timestamp}`,
    category: "tkro",
    description: "Full lifecycle test product with video and multiple photos",
    price: 35000000,
    stock: 12,
    image: "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/test-img1.png",
    images: [
      "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/test-img1.png",
      "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/test-img2.png",
    ],
    video: "https://www.youtube.com/watch?v=sample123",
    active: true,
    sku: `TEST-SKU-${timestamp}`,
    brand: "Boemi Test",
  };

  // Step 1: CREATE
  console.log("\n[1/5] Testing Create...");
  const dbPayload = toDbRow(testInput, true);
  console.log("Generated ID:", dbPayload.id);
  console.log("Payload keys:", Object.keys(dbPayload));
  console.log("Does payload contain 'video' key?", "video" in dbPayload);
  console.log("Gallery contents:", dbPayload.gallery);

  const { data: createdData, error: createError } = await sb
    .from("products")
    .insert(dbPayload)
    .select("id")
    .single();

  if (createError) {
    console.error("Create failed!", createError);
    return;
  }
  const createdId = createdData.id;
  console.log("Create successful! Returned ID:", createdId);

  // Step 2: READ (ById and BySlug)
  console.log("\n[2/5] Testing Read...");
  const { data: readById, error: readError } = await sb
    .from("products")
    .select("*")
    .eq("id", createdId)
    .maybeSingle();

  if (readError) {
    console.error("Read by ID failed!", readError);
  } else {
    console.log("Read by ID success! Found row name:", readById.name);
    const parsed = fromRow(readById);
    console.log("Parsed fromRow -> video:", parsed.video);
    console.log("Parsed fromRow -> images count:", parsed.images.length);
    console.log("Video extracted accurately?", parsed.video === testInput.video);
  }

  // Step 3: UPDATE
  console.log("\n[3/5] Testing Update...");
  const updateInput = {
    ...testInput,
    name: `Updated Test Product ${timestamp}`,
    price: 40000000,
    stock: 25,
    video: "https://www.youtube.com/watch?v=updatedVideo",
  };
  const updateDbPayload = toDbRow(updateInput, false);
  const { error: updateError } = await sb
    .from("products")
    .update(updateDbPayload)
    .or(`id.eq.${createdId},slug.eq.${createdId}`);

  if (updateError) {
    console.error("Update failed!", updateError);
  } else {
    console.log("Update executed successfully!");
    // Verify updated state in DB
    const { data: verifyRow } = await sb
      .from("products")
      .select("*")
      .eq("id", createdId)
      .maybeSingle();
    console.log("Verified in DB -> name:", verifyRow.name);
    console.log("Verified in DB -> price:", verifyRow.price);
    console.log("Verified in DB -> stock:", verifyRow.stock);
    const parsedUpdated = fromRow(verifyRow);
    console.log("Verified in DB -> video:", parsedUpdated.video);
  }

  // Step 4: DELETE
  console.log("\n[4/5] Testing Delete...");
  const { error: deleteError } = await sb
    .from("products")
    .delete()
    .or(`id.eq.${createdId},slug.eq.${createdId}`);

  if (deleteError) {
    console.error("Delete failed!", deleteError);
  } else {
    console.log("Delete executed successfully!");
  }

  // Step 5: VERIFY DELETION
  console.log("\n[5/5] Verifying Deletion...");
  const { data: checkDeleted } = await sb
    .from("products")
    .select("id")
    .eq("id", createdId)
    .maybeSingle();

  if (checkDeleted) {
    console.error("Deletion check FAILED: Row still exists!", checkDeleted);
  } else {
    console.log("Deletion verified: Row no longer exists in boemi.products! PASS.");
  }
}

testLifecycle();
