import { querySupabaseRest } from '../../tests/e2e/helpers.mjs';

async function testSpecialSearches() {
  const tests = [
    'mesin',
    'mesin (cnc)',
    'mesin,las',
    'test*wildcard',
    'single\'quote',
    'double"quote',
    'script<alert>',
    '%20',
  ];

  for (const t of tests) {
    const s = encodeURIComponent(t.trim());
    const query = `select=id,name&or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)&limit=5`;
    const res = await querySupabaseRest('products', query);
    console.log(JSON.stringify(t), '-> status:', res.status, 'ok:', res.ok, 'count:', res.data?.length, 'error:', res.data?.message || null);
  }
}

testSpecialSearches();
