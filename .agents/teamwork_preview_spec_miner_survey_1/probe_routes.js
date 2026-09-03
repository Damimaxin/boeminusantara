const http = require('http');

const routes = [
  '/',
  '/cari',
  '/cari?q=mesin',
  '/kategori/tkro',
  '/produk/penyangga-mesin-diesel-mesin-hidup-diesel-engine-stand-life-engine-tkro-2',
  '/penawaran',
  '/keranjang',
  '/tentang',
  '/edukasi',
  '/admin/produk',
  '/admin/kategori'
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:4789${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          location: res.headers.location || null,
          contentLength: data.length
        });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function main() {
  const results = [];
  for (const r of routes) {
    const res = await checkRoute(r);
    results.push(res);
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
