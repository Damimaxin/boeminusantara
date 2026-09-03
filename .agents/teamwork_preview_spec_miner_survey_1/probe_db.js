const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const raw = fs.readFileSync('.env.local', 'utf8');
const env = {};
raw.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(url, key, { db: { schema: 'boemi' } });

async function run() {
  const tables = [
    'products',
    'categories',
    'customer_profiles',
    'addresses',
    'coupons',
    'orders',
    'order_items',
    'payments',
    'suppliers',
    'stock_movements',
    'quote_requests',
    'quote_request_items',
    'quotations',
    'articles',
    'banners',
    'pages',
    'company_profile',
    'audit_log',
    'attachments',
    'ratings',
    'complaints',
    'asset_care',
    'quote_offers',
    'quote_offer_items',
    'doc_counters'
  ];
  const results = {};
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    results[t] = error ? `Error: ${error.message}` : `Count: ${count}`;
  }
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
