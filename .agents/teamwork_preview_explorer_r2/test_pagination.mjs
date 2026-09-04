import { querySupabaseRest } from '../../tests/e2e/helpers.mjs';

// Replicate getProducts logic from lib/products.ts
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

function mapRowToProduct(item) {
  const rawGallery = Array.isArray(item.gallery)
    ? item.gallery
    : Array.isArray(item.images)
    ? item.images
    : [];

  const videoItem = rawGallery.find((g) => typeof g === "string" && isVideoLink(g));
  const imagesList = rawGallery.filter((g) => g !== videoItem);

  return {
    ...item,
    images: imagesList,
    video: videoItem || item.video || null,
  };
}

async function testGetProducts(q = {}) {
  const DEFAULT_PAGE_SIZE = 24;
  const pageSize = q.pageSize && q.pageSize > 0 ? q.pageSize : DEFAULT_PAGE_SIZE;
  const page = q.page && q.page > 0 ? q.page : 1;
  const offset = (page - 1) * pageSize;

  let orderQuery = "order=name.asc";
  if (q.sort === "price_asc") orderQuery = "order=price.asc";
  else if (q.sort === "price_desc") orderQuery = "order=price.desc";

  let query = `select=*&${orderQuery}&limit=1000`;
  if (q.category) {
    query += `&category=eq.${encodeURIComponent(q.category)}`;
  }
  if (q.search) {
    const s = encodeURIComponent(q.search.trim());
    query += `&or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)`;
  }

  const res = await querySupabaseRest('products', query);
  let rawProducts = [];
  if (res.ok && Array.isArray(res.data)) {
    rawProducts = res.data.map(mapRowToProduct);
  }

  // Deduplication
  const map = new Map();
  for (const item of rawProducts) {
    const normKey = (item.name || "").trim().toLowerCase();
    if (!map.has(normKey)) {
      map.set(normKey, item);
    }
  }

  let allProducts = Array.from(map.values());

  if (q.search) {
    const s = q.search.toLowerCase().trim();
    allProducts = allProducts.filter((p) => {
      const matchName = p.name && p.name.toLowerCase().includes(s);
      const matchBrand = p.brand && p.brand.toLowerCase().includes(s);
      const matchDesc = p.description && p.description.toLowerCase().includes(s);
      const matchSlug = p.slug && p.slug.toLowerCase().includes(s);
      const matchId = p.id && p.id.toLowerCase().includes(s);
      const matchSku = p.sku && p.sku.toLowerCase().includes(s);
      return matchName || matchBrand || matchDesc || matchSlug || matchId || matchSku;
    });
  }

  if (q.sort === "price_asc") {
    allProducts.sort((a, b) => a.price - b.price);
  } else if (q.sort === "price_desc") {
    allProducts.sort((a, b) => b.price - a.price);
  } else {
    allProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = allProducts.length;
  const pagedProducts = allProducts.slice(offset, offset + pageSize);

  return { total, count: pagedProducts.length, page, pageSize, offset };
}

async function run() {
  console.log("=== Testing getProducts Edge Cases ===");
  console.log("1. Normal Page 1:", await testGetProducts({ page: 1 }));
  console.log("2. Normal Page 2:", await testGetProducts({ page: 2 }));
  console.log("3. Out-of-bounds Page 999:", await testGetProducts({ page: 999 }));
  console.log("4. Page 0 (should clamp to 1):", await testGetProducts({ page: 0 }));
  console.log("5. Page -5 (should clamp to 1):", await testGetProducts({ page: -5 }));
  console.log("6. Float page 1.5:", await testGetProducts({ page: 1.5 }));
  console.log("7. Search 'mesin' Page 1:", await testGetProducts({ search: "mesin", page: 1 }));
  console.log("8. Search 'mesin' Page 999:", await testGetProducts({ search: "mesin", page: 999 }));
  console.log("9. Category 'tkro' Page 1:", await testGetProducts({ category: "tkro", page: 1 }));
  console.log("10. Category 'tkro' Page 999:", await testGetProducts({ category: "tkro", page: 999 }));
  console.log("11. Category 'tp' (15 items) Page 1:", await testGetProducts({ category: "tp", page: 1 }));
  console.log("12. Category 'tp' (15 items) Page 2 (out of bounds):", await testGetProducts({ category: "tp", page: 2 }));
}

run();
