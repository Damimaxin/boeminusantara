import fs from "node:fs";
import path from "node:path";

// Load .env.local
const envFile = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, "utf8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([A-Z_]+)=\"?([^\r\n\"]+)\"?/);
    if (m) {
      process.env[m[1]] = m[2].trim();
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== ENV CHECK ===");
console.log("URL:", url ? "FOUND (" + url + ")" : "MISSING");
console.log("ANON_KEY:", anonKey ? "FOUND (" + anonKey.slice(0, 15) + "...)" : "MISSING");
console.log("SERVICE_ROLE_KEY:", serviceKey ? "FOUND (" + serviceKey.slice(0, 15) + "...)" : "MISSING");

async function run() {
  // 1. Fetch OpenAPI definition for schema 'boemi'
  console.log("\n=== 1. FETCHING POSTGREST OPENAPI SCHEMA (boemi) ===");
  try {
    const res = await fetch(`${url}/rest/v1/?apikey=${serviceKey}`, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Accept-Profile": "boemi",
        Accept: "application/openapi+json, application/json",
      },
    });
    console.log("OpenAPI status:", res.status);
    if (res.ok) {
      const spec = await res.json();
      console.log("OpenAPI title:", spec.info?.title);
      console.log("Tables in boemi:", Object.keys(spec.definitions || {}));
      const prodDef = spec.definitions?.products;
      if (prodDef) {
        console.log("boemi.products definition found!");
        console.log("Properties (Columns):", JSON.stringify(prodDef.properties, null, 2));
        console.log("Required fields:", prodDef.required);
      } else {
        console.log("No 'products' in definitions. Available:", Object.keys(spec.definitions || {}));
      }
    } else {
      console.log("OpenAPI error:", await res.text());
    }
  } catch (err) {
    console.error("OpenAPI fetch failed:", err.message);
  }

  // 2. Fetch sample rows from boemi.products
  console.log("\n=== 2. FETCH SAMPLE ROWS FROM boemi.products ===");
  try {
    const res = await fetch(`${url}/rest/v1/products?select=*&limit=2`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Accept-Profile": "boemi",
        Prefer: "count=exact",
      },
    });
    console.log("Query status:", res.status, res.statusText);
    const countHeader = res.headers.get("content-range");
    console.log("Content-Range:", countHeader);
    const data = await res.json();
    console.log("Returned count:", Array.isArray(data) ? data.length : 0);
    if (Array.isArray(data) && data.length > 0) {
      console.log("Columns on row 0:", Object.keys(data[0]));
      console.log("Sample row 0:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("Data:", data);
    }
  } catch (err) {
    console.error("Sample row fetch failed:", err.message);
  }

  // 3. Test inserting with 'video' column directly
  console.log("\n=== 3. TEST INSERTING 'video' COLUMN DIRECTLY ===");
  try {
    const testPayloadWithVideo = {
      id: "test-probe-" + Date.now(),
      slug: "test-probe-slug-" + Date.now(),
      name: "Test Probe Product",
      category: "tkro",
      description: "Test description",
      price: 100000,
      stock: 5,
      video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    };
    const res = await fetch(`${url}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Accept-Profile": "boemi",
        "Content-Profile": "boemi",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(testPayloadWithVideo),
    });
    console.log("Insert with video status:", res.status, res.statusText);
    const body = await res.text();
    console.log("Insert with video response:", body);
  } catch (err) {
    console.error("Insert with video error:", err.message);
  }

  // 4. Test inserting WITHOUT 'id' (auto-generation test)
  console.log("\n=== 4. TEST INSERTING WITHOUT 'id' (AUTO-GENERATION TEST) ===");
  try {
    const testPayloadWithoutId = {
      slug: "test-noid-" + Date.now(),
      name: "Test No-Id Product",
      category: "tkro",
      description: "Test description",
      price: 150000,
      stock: 1,
    };
    const res = await fetch(`${url}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Accept-Profile": "boemi",
        "Content-Profile": "boemi",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(testPayloadWithoutId),
    });
    console.log("Insert without id status:", res.status, res.statusText);
    const body = await res.text();
    console.log("Insert without id response:", body);
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed) && parsed[0]?.id) {
        // Clean up test product
        const cleanId = parsed[0].id;
        console.log("Cleaning up test product:", cleanId);
        await fetch(`${url}/rest/v1/products?id=eq.${cleanId}`, {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Accept-Profile": "boemi",
            "Content-Profile": "boemi",
          },
        });
      }
    } catch {}
  } catch (err) {
    console.error("Insert without id error:", err.message);
  }

  // 5. Test inserting WITH custom text 'id' (like toDbRow generates)
  console.log("\n=== 5. TEST INSERTING WITH CUSTOM TEXT 'id' (toDbRow pattern) ===");
  try {
    const customId = `boemi-tkro-test-${Date.now().toString(36)}`;
    const testPayloadWithCustomId = {
      id: customId,
      slug: "test-customid-" + Date.now(),
      name: "Test Custom ID Product",
      category: "tkro",
      description: "Test description",
      price: 200000,
      stock: 2,
    };
    const res = await fetch(`${url}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Accept-Profile": "boemi",
        "Content-Profile": "boemi",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(testPayloadWithCustomId),
    });
    console.log("Insert with custom id status:", res.status, res.statusText);
    const body = await res.text();
    console.log("Insert with custom id response:", body);
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed) && parsed[0]?.id) {
        console.log("Cleaning up custom id test product:", parsed[0].id);
        await fetch(`${url}/rest/v1/products?id=eq.${parsed[0].id}`, {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Accept-Profile": "boemi",
            "Content-Profile": "boemi",
          },
        });
      }
    } catch {}
  } catch (err) {
    console.error("Insert with custom id error:", err.message);
  }
}

run();
