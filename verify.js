// ---------------------------------------------------------------------------
// verify.js — check every page against the live store before you publish.
//
//   node verify.js
//
// Run this after editing any data/page-*.json and before you push a page to
// Netlify or Vercel. It pulls the real catalogue from megastore76.com and
// checks that every product link on every page still resolves, that every
// price printed on a page is the price the store is actually charging, and
// that every image is one of that product's own images.
//
// What it CANNOT check: whether the picture itself is honest. Some listings
// carry a generated marketing poster that prints a price, a rating or an
// award the store cannot support, and that text lives inside the image where
// no script can see it. Look at the image yourself before you put it on a
// page promising the reader a real photograph.
//
// A page that fails here will show a customer a price the checkout disagrees
// with. That is the one mistake that turns a sale into a complaint, so it is
// worth the thirty seconds this takes.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const STORE = 'https://megastore76.com/wp-json/wc/store/v1/products';

// ---- pull the live catalogue ---------------------------------------------
async function fetchCatalogue() {
  const all = [];
  for (let page = 1; page <= 6; page++) {
    const res = await fetch(`${STORE}?per_page=100&page=${page}&status=publish`);
    if (!res.ok) throw new Error(`store API returned ${res.status} on page ${page}`);
    const batch = await res.json();
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

const money = (n) => '£' + Number(n).toFixed(2);

function main(catalogue) {
  // the store API calls the product's web address "permalink"
  const live = new Map(
    catalogue.map((p) => [
      p.permalink,
      {
        price: Number(p.prices.price) / Math.pow(10, p.prices.currency_minor_unit || 2),
        name: p.name,
        img: (p.images[0] || {}).src,
        // Every image the product itself carries. A page may legitimately use a
        // second gallery image rather than the featured one — for several
        // products here the featured image is a generated poster and the real
        // photograph is further down the gallery. Accepting the product's whole
        // image set still rules out a stock photo or another product's picture,
        // which is what this check is for.
        imgs: p.images.map((i) => i.src),
        inStock: p.is_in_stock,
      },
    ])
  );

  console.log(`Live catalogue: ${catalogue.length} published products, ${live.size} product pages indexed.\n`);

  const files = fs.readdirSync(DATA).filter((f) => f.startsWith('page-') && f.endsWith('.json')).sort();
  if (!files.length) {
    console.error('No data/page-*.json files found.');
    process.exit(1);
  }

  let checked = 0;
  const problems = [];

  // walk the whole page description, wherever a URL appears
  function walk(node, file, trail) {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, file, `${trail}[${i}]`));
    if (!node || typeof node !== 'object') return;

    if (typeof node.url === 'string' && node.url.includes('megastore76.com/product/')) {
      checked++;
      const real = live.get(node.url);
      if (!real) {
        problems.push(`${file}  ${trail}\n    link goes nowhere — the store has no product at ${node.url}`);
      } else {
        if (node.price != null && Number(node.price) !== Number(real.price)) {
          problems.push(
            `${file}  ${trail}\n    page says ${money(node.price)}, the store charges ${money(real.price)}  (${real.name})`
          );
        }
        if (node.img && real.imgs.length && !real.imgs.includes(node.img)) {
          problems.push(`${file}  ${trail}\n    image is not one of this product's own photos  (${real.name})`);
        }
        if (real.inStock === false) {
          problems.push(`${file}  ${trail}\n    this product is out of stock  (${real.name})`);
        }
      }
    }
    Object.entries(node).forEach(([k, v]) => walk(v, file, `${trail}.${k}`));
  }

  for (const f of files) {
    let page;
    try {
      page = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
    } catch (e) {
      problems.push(`${f}\n    this file is not valid JSON — ${e.message}`);
      continue;
    }
    const before = problems.length;
    walk(page, f, f.replace(/\.json$/, ''));
    console.log(`${problems.length === before ? '  ok  ' : ' FAIL '} ${f}`);
  }

  console.log('');
  if (problems.length) {
    console.log(`${checked} product references checked — ${problems.length} problem(s):\n`);
    problems.forEach((p) => console.log('  - ' + p + '\n'));
    console.log('Fix these in data/, then run "node build.js" again.');
    process.exit(1);
  }

  console.log(`${checked} product references checked — every link resolves,`);
  console.log('every price matches the store, every image is one of the product\'s own.');
  console.log('');
  console.log('This does not judge the pictures themselves — open the page and look.');
}

fetchCatalogue()
  .then(main)
  .catch((e) => {
    console.error('Could not reach the store: ' + e.message);
    console.error('verification skipped — do not publish on the strength of this run.');
    process.exit(1);
  });
