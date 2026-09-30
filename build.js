#!/usr/bin/env node
/**
 * megastore76 sales-page generator
 * ------------------------------------------------------------------
 * Reads  data/page-*.json  and writes a self-contained, deployable
 * site for each one into  out/<slug>/index.html  — plus a review hub
 * at  review-hub.html  so you can click through them all locally.
 *
 *   node build.js
 *
 * Each out/<slug>/ folder is a complete static site: drag it onto
 * Netlify, or point a Vercel project at it. No build step, no deps.
 *
 * DESIGN RULES BAKED IN (from what actually converts in 2026):
 *   - The verdict is above the fold, not at the bottom. 30-50% of
 *     visitors never scroll past the first screen.
 *   - Every comparison-table row carries its own CTA  (+40-70% CTR).
 *   - One primary recommendation, repeated, not 15 competing links.
 *   - Real cons alongside the pros. Honesty converts better.
 *   - Affiliate disclosure is prominent, not buried in the footer.
 *   - Sticky CTA bar on mobile (the majority of the traffic).
 *
 * WHAT THIS FILE WILL NOT DO:
 *   It will not invent a rating, a review, a testimonial or a "sold
 *   N times" claim. There is no aggregateRating in the schema because
 *   the store has no reviews yet. If you add real reviews, add them
 *   as real data -- see README.md. Fake proof is the fastest way to
 *   lose a customer and, in the UK, to break advertising law.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'out');

// ---------------------------------------------------------------------
// brand tokens
// ---------------------------------------------------------------------
const T = {
  navy: '#0b1c3d',
  navyMid: '#14305e',
  navyLight: '#1c3f77',
  gold: '#e0a406',
  goldDark: '#8a6103',
  goldTint: '#fff8e6',
  ink: '#0f172a',
  body: '#475569',
  line: '#e2e8f0',
  tint: '#f8fafc',
  green: '#15803d',
  greenTint: '#f0fdf4',
  red: '#b91c1c',
  store: 'https://megastore76.com',
  brand: 'Megastore76',
  phone: '+44 7869 160958',
  tel: 'tel:+447869160958',
  mail: 'mailto:megaphilip76@gmail.com',
};

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (n) =>
  '£' + Number(n).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------
// stylesheet — inlined into every page so each folder is self-contained
// ---------------------------------------------------------------------
const CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
 color:${T.ink};background:#fff;line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
a{color:${T.navyMid}}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.narrow{max-width:760px}

/* ---------- sticky header ---------- */
.bar{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);
 border-bottom:1px solid ${T.line}}
.bar .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:62px}
.brand{font-weight:900;letter-spacing:-.02em;font-size:1.06em;color:${T.navy};text-decoration:none;white-space:nowrap}
.brand b{color:${T.gold}}
.bar nav{display:none;gap:22px;font-size:.93em;font-weight:600}
.bar nav a{color:${T.body};text-decoration:none}
.bar nav a:hover{color:${T.navy}}
@media(min-width:820px){.bar nav{display:flex}}

/* ---------- buttons ---------- */
.btn{display:inline-block;font-weight:800;text-decoration:none;border-radius:10px;
 padding:15px 30px;font-size:1.02em;line-height:1;border:2px solid transparent;
 transition:transform .12s ease, box-shadow .12s ease;text-align:center}
.btn:hover{transform:translateY(-1px)}
.btn-gold{background:${T.gold};color:${T.navy};box-shadow:0 4px 14px rgba(224,164,6,.35)}
.btn-navy{background:${T.navy};color:#fff}
.btn-ghost{background:#fff;color:${T.navy};border-color:${T.line}}
.btn-sm{padding:11px 20px;font-size:.92em;border-radius:8px}
.btn-block{display:block;width:100%}

/* ---------- hero ---------- */
.hero{background:linear-gradient(142deg,${T.navy} 0%,${T.navyMid} 58%,${T.navyLight} 100%);
 color:#fff;padding:52px 0 44px}
.hero .eyebrow{display:inline-block;background:rgba(224,164,6,.16);border:1px solid rgba(224,164,6,.45);
 color:${T.gold};font-weight:800;font-size:.76em;letter-spacing:.11em;text-transform:uppercase;
 padding:7px 14px;border-radius:99px;margin:0 0 18px}
.hero h1{font-size:2.35em;line-height:1.14;margin:0 0 16px;font-weight:900;letter-spacing:-.02em;max-width:19em}
.hero .sub{font-size:1.13em;color:#d8e4f7;margin:0 0 26px;max-width:40em}
.hero .cta-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:0 0 26px}
.hero .micro{font-size:.93em;color:#9fb6d8;margin:0}
.chips{display:flex;flex-wrap:wrap;gap:9px;margin:0}
.chip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#dbe6f7;
 border-radius:99px;padding:7px 14px;font-size:.86em;font-weight:600}
@media(max-width:640px){.hero{padding:34px 0 32px}.hero h1{font-size:1.72em}.hero .sub{font-size:1.03em}}

/* ---------- sections ---------- */
section{padding:52px 0}
section.tint{background:${T.tint};border-top:1px solid ${T.line};border-bottom:1px solid ${T.line}}
h2{font-size:1.78em;line-height:1.2;margin:0 0 12px;font-weight:900;letter-spacing:-.02em}
h3{font-size:1.18em;margin:0 0 8px;font-weight:800}
.lede{color:${T.body};font-size:1.06em;margin:0 0 30px;max-width:44em}
.kicker{color:${T.goldDark};font-weight:800;font-size:.79em;letter-spacing:.1em;
 text-transform:uppercase;margin:0 0 9px}

/* ---------- verdict (the short answer) ---------- */
.verdict-grid{display:grid;gap:18px;grid-template-columns:1fr}
@media(min-width:760px){.verdict-grid{grid-template-columns:repeat(3,1fr)}}
.vcard{background:#fff;border:2px solid ${T.line};border-radius:16px;padding:24px;
 display:flex;flex-direction:column;position:relative}
.vcard.hero-pick{border-color:${T.gold};box-shadow:0 10px 34px rgba(224,164,6,.17)}
.vcard .tag{position:absolute;top:-13px;left:22px;background:${T.gold};color:${T.navy};
 font-weight:900;font-size:.72em;letter-spacing:.08em;text-transform:uppercase;
 padding:6px 13px;border-radius:99px}
.vcard .tag.plain{background:${T.navy};color:#fff}
.vcard h3{font-size:1.1em;margin:6px 0 6px;line-height:1.32}
.vcard .price{font-size:1.5em;font-weight:900;color:${T.navy};margin:0 0 12px}
.vcard .why{color:${T.body};font-size:.96em;margin:0 0 18px;flex:1}
.vcard ul{margin:0 0 18px;padding-left:19px;color:${T.body};font-size:.93em}
.vcard li{margin:0 0 5px}

/* ---------- comparison table ---------- */
.tablescroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid ${T.line};
 border-radius:14px;background:#fff}
table{width:100%;border-collapse:collapse;min-width:720px;font-size:.95em}
thead th{background:${T.navy};color:#fff;text-align:left;padding:15px 16px;font-weight:800;
 font-size:.86em;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
tbody td{padding:16px;border-top:1px solid ${T.line};vertical-align:middle}
tbody tr:nth-child(even){background:#fcfdff}
tbody tr.pickrow{background:${T.goldTint}}
tbody tr.pickrow td:first-child{box-shadow:inset 4px 0 0 ${T.gold}}
.pname{font-weight:800;color:${T.ink};display:block;margin-bottom:3px}
.pspec{color:${T.body};font-size:.88em}
.pprice{font-weight:900;color:${T.navy};white-space:nowrap;font-size:1.06em}
.bestfor{color:${T.body};font-size:.93em}
.oldprice{color:#94a3b8;text-decoration:line-through;font-weight:600;font-size:.82em;
 display:block;margin-top:2px}

/* ---------- product deep dives ---------- */
.prod{background:#fff;border:1px solid ${T.line};border-radius:18px;padding:0;overflow:hidden;
 margin:0 0 26px;display:grid;grid-template-columns:1fr}
@media(min-width:820px){.prod{grid-template-columns:330px 1fr}
 .prod.flip .prod-media{order:2}.prod.flip .prod-body{order:1}}
.prod-media{background:${T.tint};display:flex;align-items:center;justify-content:center;
 padding:22px;border-bottom:1px solid ${T.line}}
@media(min-width:820px){.prod-media{border-bottom:0;border-right:1px solid ${T.line}}}
.prod-media img{max-height:250px;width:auto;object-fit:contain}
.noimg{color:${T.body};font-size:.84em;line-height:1.4;text-align:center;padding:0 22px;max-width:24em}
.prod-body{padding:26px}
.prod-body .badge{display:inline-block;background:${T.gold};color:${T.navy};font-weight:900;
 font-size:.72em;letter-spacing:.07em;text-transform:uppercase;padding:5px 12px;border-radius:99px;margin:0 0 12px}
.prod-body .badge.alt{background:${T.navyMid};color:#fff}
.prod-body h3{font-size:1.32em;margin:0 0 6px;line-height:1.28}
.prow{display:flex;align-items:baseline;gap:12px;margin:0 0 16px;flex-wrap:wrap}
.prow .big{font-size:1.6em;font-weight:900;color:${T.navy}}
.prow .stock{color:${T.green};font-weight:700;font-size:.9em}
.prod-body .sum{color:${T.body};margin:0 0 18px}
.specs{list-style:none;margin:0 0 20px;padding:0;display:grid;gap:7px}
.specs li{position:relative;padding-left:26px;color:${T.body};font-size:.95em}
.specs li::before{content:"";position:absolute;left:0;top:.52em;width:14px;height:8px;
 border-left:2.5px solid ${T.green};border-bottom:2.5px solid ${T.green};transform:rotate(-45deg)}
.pc{display:grid;gap:16px;grid-template-columns:1fr;margin:0 0 20px}
@media(min-width:620px){.pc{grid-template-columns:1fr 1fr}}
.pc h4{margin:0 0 7px;font-size:.82em;letter-spacing:.07em;text-transform:uppercase}
.pc .good h4{color:${T.green}}
.pc .bad h4{color:${T.red}}
.pc ul{margin:0;padding-left:19px;font-size:.93em;color:${T.body}}
.pc li{margin:0 0 5px}
.forwho{background:${T.tint};border-left:3px solid ${T.gold};border-radius:0 10px 10px 0;
 padding:13px 17px;font-size:.94em;color:${T.body};margin:0 0 20px}
.forwho b{color:${T.ink}}

/* ---------- guide ---------- */
.gpoints{display:grid;gap:18px;grid-template-columns:1fr}
@media(min-width:760px){.gpoints{grid-template-columns:1fr 1fr}}
.gpoint{background:#fff;border:1px solid ${T.line};border-radius:14px;padding:22px}
.gpoint .num{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;
 border-radius:9px;background:${T.navy};color:${T.gold};font-weight:900;font-size:.92em;margin:0 0 12px}
.gpoint p{margin:0;color:${T.body};font-size:.96em}

/* ---------- faq ---------- */
details{background:#fff;border:1px solid ${T.line};border-radius:12px;margin:0 0 11px;overflow:hidden}
details[open]{border-color:${T.gold}}
summary{cursor:pointer;padding:18px 22px;font-weight:800;font-size:1.02em;list-style:none;
 display:flex;justify-content:space-between;gap:16px;align-items:center}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";font-size:1.5em;color:${T.goldDark};font-weight:400;line-height:1;flex:none}
details[open] summary::after{content:"\\2013"}
details p{margin:0;padding:0 22px 20px;color:${T.body}}

/* ---------- final verdict ---------- */
.fvrow{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;
 background:#fff;border:1px solid ${T.line};border-radius:14px;padding:20px 24px;margin:0 0 12px}
.fvrow .who{font-weight:800;flex:1 1 190px}
.fvrow .who span{display:block;font-weight:500;color:${T.body};font-size:.92em;margin-top:3px}

/* ---------- trust band ---------- */
.trust{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:700px){.trust{grid-template-columns:repeat(3,1fr)}}
.tcard{background:#fff;border:1px solid ${T.line};border-radius:14px;padding:22px;text-align:center}
.tcard .ic{font-size:1.6em;margin:0 0 8px}
.tcard b{display:block;margin:0 0 5px}
.tcard p{margin:0;color:${T.body};font-size:.92em}

/* ---------- cta band ---------- */
.ctaband{background:linear-gradient(142deg,${T.navyMid},${T.navyLight});color:#fff;
 border-radius:18px;padding:40px 32px;text-align:center}
.ctaband h2{color:#fff}
.ctaband p{color:#d8e4f7;max-width:40em;margin:0 auto 24px}

/* ---------- placeholder notice ---------- */
.todo{background:#fffbeb;border:1px dashed #d4a017;border-radius:12px;padding:18px 20px;margin:0 0 20px}
.todo b{color:${T.goldDark}}
.todo p{margin:6px 0 0;font-size:.93em;color:#78540a}

/* ---------- footer ---------- */
footer{background:${T.navy};color:#9fb6d8;padding:44px 0 30px;font-size:.93em}
footer a{color:#d8e4f7}
footer h4{color:#fff;margin:0 0 10px;font-size:.95em}
.disc{border-top:1px solid rgba(255,255,255,.14);margin-top:28px;padding-top:22px;
 font-size:.87em;color:#7f97bb;line-height:1.7}

/* ---------- sticky mobile cta ---------- */
.sticky{position:fixed;left:0;right:0;bottom:0;z-index:70;background:#fff;
 border-top:1px solid ${T.line};padding:11px 16px;display:flex;gap:12px;align-items:center;
 justify-content:space-between;box-shadow:0 -4px 18px rgba(15,23,42,.09);
 transform:translateY(115%);transition:transform .26s ease}
.sticky.show{transform:translateY(0)}
.sticky .lbl{font-size:.83em;line-height:1.25;color:${T.body}}
.sticky .lbl b{display:block;color:${T.ink};font-size:1.06em}
.sticky .btn{flex:none}
@media(min-width:820px){.sticky{display:none}}
body.sb{padding-bottom:74px}
@media(min-width:820px){body.sb{padding-bottom:0}}
@media print{.bar,.sticky{display:none}}

/* ---------- product thumbnail in a verdict card ---------- */
.vthumb{background:${T.tint};border-radius:12px;padding:12px;margin:0 0 15px;
 display:flex;align-items:center;justify-content:center;height:134px}
.vthumb img{max-height:110px;width:auto;max-width:100%;object-fit:contain}

/* ---------- product thumbnail in a comparison-table row ---------- */
.tcell{display:flex;gap:11px;align-items:center;min-width:190px}
.tthumb{width:54px;height:54px;flex:none;background:${T.tint};border:1px solid ${T.line};
 border-radius:9px;padding:4px;display:flex;align-items:center;justify-content:center}
.tthumb img{max-width:100%;max-height:100%;width:auto;object-fit:contain}

/* ---------- "shop the range" image grid ---------- */
.gal{display:grid;gap:14px;grid-template-columns:repeat(2,1fr)}
@media(min-width:620px){.gal{grid-template-columns:repeat(3,1fr)}}
@media(min-width:940px){.gal{grid-template-columns:repeat(4,1fr)}}
.gitem{background:#fff;border:1px solid ${T.line};border-radius:14px;padding:14px;
 display:flex;flex-direction:column;text-decoration:none;color:inherit;
 transition:transform .12s ease,box-shadow .12s ease}
.gitem:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(15,23,42,.10)}
.gitem .gimg{height:120px;display:flex;align-items:center;justify-content:center;margin:0 0 11px}
.gitem .gimg img{max-height:112px;width:auto;max-width:100%;object-fit:contain}
.gitem .gn{font-size:.9em;line-height:1.32;display:block;margin:0 0 5px;color:${T.ink};font-weight:700}
.gitem .gp{font-weight:900;color:${T.navy};font-size:1.04em;margin-top:auto}
.gitem .gwas{color:${T.body};font-weight:600;font-size:.86em;text-decoration:line-through;margin-left:7px}
`;

// Extra CSS for the optional `posts` section — a pictured grid of blog posts
// grouped by subject, plus a text-only list of the rest. Kept separate and
// injected only when a page defines `posts`, so every other page's HTML stays
// byte-for-byte what it was.
const POSTS_CSS = `
#posts .pgh{font-size:1.08em;margin:38px 0 5px;color:${T.ink}}
#posts .pgh:first-of-type{margin-top:26px}
#posts .pgsub{margin:0 0 16px;color:${T.body};font-size:.93em;line-height:1.5;max-width:70ch}
#posts .pgrid{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:560px){#posts .pgrid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){#posts .pgrid{grid-template-columns:repeat(3,1fr)}}
#posts .pcard{display:flex;flex-direction:column;background:#fff;border:1px solid ${T.line};border-radius:14px;overflow:hidden;text-decoration:none;transition:transform .15s,box-shadow .15s}
#posts .pcard:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(15,23,42,.10)}
#posts .pimg{display:block;height:186px;background:#eef2f8;overflow:hidden}
#posts .pimg img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
#posts .pbody{display:flex;flex-direction:column;flex:1;padding:14px 15px 17px}
#posts .ptag{align-self:flex-start;font-size:.66em;text-transform:uppercase;letter-spacing:.09em;font-weight:800;color:${T.navy};background:#eef2f8;border-radius:999px;padding:3px 9px;margin:0 0 9px}
#posts .pt{display:block;font-weight:800;color:${T.ink};font-size:.98em;line-height:1.33;margin:0 0 8px}
#posts .px{display:block;color:${T.body};font-size:.87em;line-height:1.5}
#posts .pmore{margin:40px 0 0;background:#fff;border:1px solid ${T.line};border-radius:14px;padding:22px 24px}
#posts .pmore .pgh{margin:0 0 6px}
#posts .pmore .pgsub{margin:0 0 14px}
#posts .pmore ul{list-style:none;margin:0;padding:0;display:grid;gap:9px;grid-template-columns:1fr}
@media(min-width:620px){#posts .pmore ul{grid-template-columns:repeat(2,1fr)}}
@media(min-width:960px){#posts .pmore ul{grid-template-columns:repeat(3,1fr)}}
#posts .pmore li{font-size:.9em;line-height:1.42}
#posts .pmore li a{color:${T.navy};text-decoration:none;border-bottom:1px solid #c9d6e8}
#posts .pmore li a:hover{border-bottom-color:${T.navy}}
`;

// Extra CSS for the optional `shelves` section — a pictured grid of listings,
// shelf by shelf, each tile carrying that listing's own image and price, plus a
// text list of the department's remaining listings. Injected only when a page
// defines `shelves`, so no other page's HTML moves.
const SHELVES_CSS = `
#shelves .shg{margin:46px 0 0}
#shelves .shg:first-of-type{margin-top:24px}
#shelves .shgh{font-size:1.16em;margin:0 0 5px;color:${T.ink};display:flex;align-items:baseline;gap:11px;flex-wrap:wrap}
#shelves .shcount{font-size:.68em;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:${T.body};white-space:nowrap}
#shelves .shsub{margin:0 0 17px;color:${T.body};font-size:.93em;line-height:1.55;max-width:74ch}
#shelves .sgrid{display:grid;gap:15px;grid-template-columns:repeat(2,1fr)}
@media(min-width:600px){#shelves .sgrid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:960px){#shelves .sgrid{grid-template-columns:repeat(4,1fr)}}
#shelves .sitem{display:flex;flex-direction:column;background:#fff;border:1px solid ${T.line};border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .14s ease,box-shadow .14s ease}
#shelves .sitem:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(15,23,42,.10)}
#shelves .simg{display:flex;align-items:center;justify-content:center;height:176px;background:#eef2f8;padding:11px}
#shelves .simg img{max-height:154px;width:auto;max-width:100%;object-fit:contain;display:block}
#shelves .sbody{display:flex;flex-direction:column;flex:1;padding:11px 13px 14px}
#shelves .sbadge{align-self:flex-start;font-size:.62em;font-weight:900;letter-spacing:.07em;text-transform:uppercase;border-radius:999px;padding:3px 8px;margin:0 0 8px}
#shelves .sbadge.ours{color:#0b5d2e;background:#e3f6ea}
#shelves .sbadge.aff{color:#7a4a00;background:#fdf0d8}
#shelves .sn{display:block;font-size:.9em;line-height:1.34;font-weight:700;color:${T.ink};margin:0 0 9px}
#shelves .sp{display:block;margin-top:auto;font-weight:900;color:${T.navy};font-size:1.06em}
#shelves .slegend{background:#fff;border:1px solid ${T.line};border-left:4px solid ${T.gold};border-radius:12px;padding:17px 20px;margin:20px 0 0;font-size:.92em;color:${T.body};line-height:1.6}
#shelves .slegend b{color:${T.ink}}
#shelves .smore{margin:26px 0 0;border-top:1px dashed ${T.line};padding-top:15px}
#shelves .smore h4{margin:0 0 9px;font-size:.92em;color:${T.ink};font-weight:800}
#shelves .smore p{margin:0 0 11px;color:${T.body};font-size:.88em;line-height:1.5}
#shelves .smore ul{list-style:none;margin:0;padding:0;display:grid;gap:7px;grid-template-columns:1fr}
@media(min-width:620px){#shelves .smore ul{grid-template-columns:repeat(2,1fr)}}
@media(min-width:960px){#shelves .smore ul{grid-template-columns:repeat(3,1fr)}}
#shelves .smore li{font-size:.86em;line-height:1.42}
#shelves .smore li a{color:${T.navy};text-decoration:none;border-bottom:1px solid #c9d6e8}
#shelves .smore li a:hover{border-bottom-color:${T.navy}}
#shelves .smore li span{color:${T.body};font-size:.92em}
#shelves .shfoot{margin:26px 0 0;color:${T.body};font-size:.87em;line-height:1.6;max-width:78ch}
#shelves .shfoot b{color:${T.ink}}
`;

// ---------------------------------------------------------------------
// fragments
// ---------------------------------------------------------------------
function head(p) {
  const faqSchema = p.faq && p.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: p.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
        })),
      }
    : null;

  const items = (p.products || []).map((x) => ({
    '@type': 'ListItem',
    position: 1,
    name: x.name,
    url: x.url,
  }));

  const productSchema = p.schemaProducts
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: p.title,
        itemListElement: p.schemaProducts.map((x, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: x.name,
            image: x.img,
            description: x.summary,
            offers: {
              '@type': 'Offer',
              price: x.price.toFixed(2),
              priceCurrency: 'GBP',
              url: x.url,
              availability: 'https://schema.org/InStock',
            },
            // deliberately no aggregateRating: the store has no reviews yet
          },
        })),
      }
    : null;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.metaDescription)}">
<link rel="canonical" href="${esc(p.canonical || T.store)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.metaDescription)}">
<meta property="og:locale" content="en_GB">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="${T.navy}">
<style>${CSS}</style>${p.posts ? `
<style>${POSTS_CSS}</style>` : ''}${p.shelves ? `
<style>${SHELVES_CSS}</style>` : ''}
${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
${productSchema ? `<script type="application/ld+json">${JSON.stringify(productSchema)}</script>` : ''}
</head>
<body class="sb">`;
}

function bar(p) {
  return `<div class="bar"><div class="wrap">
  <a class="brand" href="${T.store}">Megastore<b>76</b></a>
  <nav>${(p.nav || [])
    .map((n) => `<a href="${n.href}">${esc(n.label)}</a>`)
    .join('')}</nav>
  <a class="btn btn-gold btn-sm" href="${esc(p.hero.ctaUrl)}">${esc(p.hero.ctaLabel)}</a>
</div></div>`;
}

function hero(p) {
  return `<div class="hero"><div class="wrap">
  <span class="eyebrow">${esc(p.eyebrow)}</span>
  <h1>${p.h1}</h1>
  <p class="sub">${p.intro}</p>
  <div class="cta-row">
    <a class="btn btn-gold" href="${esc(p.hero.ctaUrl)}">${esc(p.hero.ctaLabel)}</a>
    ${p.hero.secondaryLabel ? `<a class="btn btn-ghost" href="${esc(p.hero.secondaryUrl)}">${esc(p.hero.secondaryLabel)}</a>` : ''}
  </div>
  ${p.chips ? `<div class="chips">${p.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : ''}
  <p class="micro" style="margin-top:20px">${esc(p.updated)}</p>
</div></div>`;
}

function verdict(p) {
  if (!p.verdict) return '';
  const v = p.verdict;
  return `<section id="verdict"><div class="wrap">
  <p class="kicker">${esc(v.kicker || 'The short answer')}</p>
  <h2>${esc(v.heading)}</h2>
  <p class="lede">${v.intro}</p>
  <div class="verdict-grid">
  ${v.picks
    .map(
      (x) => `<div class="vcard${x.primary ? ' hero-pick' : ''}">
    <span class="tag${x.primary ? '' : ' plain'}">${esc(x.label)}</span>
    ${x.img ? `<div class="vthumb"><img src="${esc(x.img)}" alt="${esc(x.name)}" loading="lazy" decoding="async"></div>` : ''}
    <h3>${esc(x.name)}</h3>
    ${x.price ? `<div class="price">${money(x.price)}</div>` : ''}
    <p class="why">${x.why}</p>
    ${x.points ? `<ul>${x.points.map((y) => `<li>${y}</li>`).join('')}</ul>` : ''}
    <a class="btn ${x.primary ? 'btn-gold' : 'btn-navy'} btn-block" href="${esc(x.url)}">${esc(x.ctaLabel || 'Check price')}</a>
  </div>`
    )
    .join('')}
  </div>
</div></section>`;
}

function posts(p) {
  if (!p.posts || !p.posts.groups || !p.posts.groups.length) return '';
  const s = p.posts;
  return `<section id="posts"><div class="wrap">
  <p class="kicker">${esc(s.kicker || 'The blog')}</p>
  <h2>${esc(s.heading)}</h2>
  <p class="lede">${s.intro}</p>
  ${s.groups
    .map(
      (g) => `<h3 class="pgh">${esc(g.name)}</h3>
  <p class="pgsub">${esc(g.sub)}</p>
  <div class="pgrid">
  ${g.items
    .map(
      (x) => `<a class="pcard" href="${esc(x.url)}">
    <span class="pimg">${x.img ? `<img src="${esc(x.img)}" alt="${esc(x.alt || x.name)}" loading="lazy" decoding="async">` : ''}</span>
    <span class="pbody">
      ${x.tag ? `<span class="ptag">${esc(x.tag)}</span>` : ''}
      <span class="pt">${esc(x.name)}</span>
      ${x.blurb ? `<span class="px">${esc(x.blurb)}</span>` : ''}
    </span>
  </a>`
    )
    .join('')}
  </div>`
    )
    .join('')}
  ${s.more && s.more.items && s.more.items.length
    ? `<div class="pmore">
    <h3 class="pgh">${esc(s.more.heading || 'Also in this category')}</h3>
    ${s.more.sub ? `<p class="pgsub">${esc(s.more.sub)}</p>` : ''}
    <ul>${s.more.items.map((x) => `<li><a href="${esc(x.url)}">${esc(x.name)}</a></li>`).join('')}</ul>
  </div>`
    : ''}
  ${s.footnote ? `<p class="micro" style="color:${T.body};margin:18px 0 0;font-size:.88em">${esc(s.footnote)}</p>` : ''}
</div></section>`;
}

// The `shelves` section: every department pictured, one tile per listing, and a
// text list of the listings whose pictures are not shown. Every tile and every
// list entry carries a real /product/ permalink, so verify.js machine-checks the
// whole block against the live store.
function shelves(p) {
  if (!p.shelves || !p.shelves.groups || !p.shelves.groups.length) return '';
  const s = p.shelves;
  return `<section class="tint" id="shelves"><div class="wrap">
  <p class="kicker">${esc(s.kicker || 'The shelves')}</p>
  <h2>${esc(s.heading)}</h2>
  <p class="lede">${s.intro}</p>
  ${s.legend ? `<div class="slegend">${s.legend}</div>` : ''}
  ${s.groups
    .map(
      (g) => `<div class="shg">
  <h3 class="shgh">${esc(g.name)}${g.count ? `<span class="shcount">${g.count} in this department</span>` : ''}</h3>
  <p class="shsub">${esc(g.sub)}</p>
  ${g.items.length
    ? `<div class="sgrid">
  ${g.items
    .map(
      (x) => `<a class="sitem" href="${esc(x.url)}">
    <span class="simg">${x.img ? `<img src="${esc(x.img)}" alt="${esc(x.name)}" loading="lazy" decoding="async">` : ''}</span>
    <span class="sbody">
      <span class="sbadge ${x.kind === 'ours' ? 'ours' : 'aff'}">${esc(x.badge)}</span>
      <span class="sn">${esc(x.name)}</span>
      <span class="sp">${money(x.price)}</span>
    </span>
  </a>`
    )
    .join('')}
  </div>`
    : ''}
  ${g.more && g.more.items.length
    ? `<div class="smore">
    <h4>${esc(g.more.heading)}</h4>
    ${g.more.sub ? `<p>${esc(g.more.sub)}</p>` : ''}
    <ul>${g.more.items
      .map((x) => `<li><a href="${esc(x.url)}">${esc(x.name)}</a>${x.via ? ` <span>· ${esc(x.via)}</span>` : ''}</li>`)
      .join('')}</ul>
  </div>`
    : ''}
</div>`
    )
    .join('')}
  ${s.footnote ? `<p class="shfoot">${s.footnote}</p>` : ''}
</div></section>`;
}

function table(p) {
  if (!p.table) return '';
  const t = p.table;
  return `<section class="tint" id="compare"><div class="wrap">
  <p class="kicker">${esc(t.kicker || 'Compare')}</p>
  <h2>${esc(t.heading)}</h2>
  <p class="lede">${t.intro}</p>
  <div class="tablescroll">
  <table>
    <thead><tr>
      <th>Product</th><th>Key spec</th><th>${t.rows.some((r) => r.price != null) ? 'Price' : 'Products'}</th><th>Best for</th><th></th>
    </tr></thead>
    <tbody>
    ${t.rows
      .map(
        (r) => `<tr${r.pick ? ' class="pickrow"' : ''}>
      <td><div class="tcell">${r.img ? `<span class="tthumb"><img src="${esc(r.img)}" alt="" loading="lazy" decoding="async"></span>` : ''}<span><span class="pname">${esc(r.name)}</span>${r.note ? `<span class="pspec">${esc(r.note)}</span>` : ''}</span></div></td>
      <td class="pspec">${esc(r.spec)}</td>
      <td><span class="pprice">${r.price != null ? money(r.price) : r.count != null ? `${r.count} products` : '&mdash;'}</span>${r.was ? `<span class="oldprice">${money(r.was)}</span>` : ''}</td>
      <td class="bestfor">${esc(r.bestFor)}${r.replaces ? `<span class="pspec">Replaces: ${esc(r.replaces)}</span>` : ''}</td>
      <td><a class="btn btn-navy btn-sm" href="${esc(r.url)}">View</a></td>
    </tr>`
      )
      .join('')}
    </tbody>
  </table>
  </div>
  <p class="micro" style="color:${T.body};margin:14px 0 0;font-size:.88em">
    ${esc(t.footnote || 'Prices checked against megastore76.com. Stock and price can change — the store page is always the final word.')}
  </p>
</div></section>`;
}

function products(p) {
  if (!p.products || !p.products.length) return '';
  return `<section id="picks"><div class="wrap">
  <p class="kicker">${esc(p.dives.kicker || 'In detail')}</p>
  <h2>${esc(p.dives.heading)}</h2>
  <p class="lede">${p.dives.intro}</p>
  ${p.products
    .map(
      (x, i) => `<article class="prod${i % 2 ? ' flip' : ''}">
    <div class="prod-media">${x.img ? `<img src="${esc(x.img)}" alt="${esc(x.name)}" loading="lazy" decoding="async">` : `<span class="noimg">${esc(x.imgNote || 'No product photo on this listing yet')}</span>`}</div>
    <div class="prod-body">
      ${x.badge ? `<span class="badge${x.badgeAlt ? ' alt' : ''}">${esc(x.badge)}</span>` : ''}
      <h3>${esc(x.name)}</h3>
      <div class="prow">
        <span class="big">${money(x.price)}</span>
        ${x.was ? `<span class="oldprice" style="font-size:1em">${money(x.was)}</span>` : ''}
        <span class="stock">${esc(x.stock || 'In stock')}</span>
      </div>
      <p class="sum">${x.summary}</p>
      ${x.specs ? `<ul class="specs">${x.specs.map((s) => `<li>${s}</li>`).join('')}</ul>` : ''}
      <div class="pc">
        <div class="good"><h4>What's good</h4><ul>${(x.pros || []).map((s) => `<li>${s}</li>`).join('')}</ul></div>
        <div class="bad"><h4>What to weigh up</h4><ul>${(x.cons || []).map((s) => `<li>${s}</li>`).join('')}</ul></div>
      </div>
      ${x.forWho ? `<p class="forwho"><b>Best for:</b> ${x.forWho}</p>` : ''}
      <a class="btn btn-gold" href="${esc(x.url)}">${esc(x.ctaLabel || 'See the price on the store')}</a>
    </div>
  </article>`
    )
    .join('')}
</div></section>`;
}

function gallery(p) {
  if (!p.gallery || !p.gallery.items || !p.gallery.items.length) return '';
  const g = p.gallery;
  return `<section class="tint" id="range"><div class="wrap">
  <p class="kicker">${esc(g.kicker || 'The range')}</p>
  <h2>${esc(g.heading)}</h2>
  <p class="lede">${g.intro}</p>
  <div class="gal">
  ${g.items
    .map(
      (x) => `<a class="gitem" href="${esc(x.url)}">
    <span class="gimg">${x.img ? `<img src="${esc(x.img)}" alt="${esc(x.name)}" loading="lazy" decoding="async">` : ''}</span>
    <span class="gn">${esc(x.name)}</span>
    <span class="gp">${money(x.price)}${x.was ? `<span class="gwas">${money(x.was)}</span>` : ''}</span>
  </a>`
    )
    .join('')}
  </div>
  ${g.footnote ? `<p class="micro" style="color:${T.body};margin:16px 0 0;font-size:.88em">${esc(g.footnote)}</p>` : ''}
</div></section>`;
}

function guide(p) {
  if (!p.guide) return '';
  const g = p.guide;
  return `<section class="tint" id="guide"><div class="wrap">
  <p class="kicker">${esc(g.kicker || 'Buying guide')}</p>
  <h2>${esc(g.heading)}</h2>
  <p class="lede">${g.intro}</p>
  <div class="gpoints">
  ${g.points.map((x, i) => `<div class="gpoint">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <h3>${esc(x.h)}</h3><p>${x.p}</p>
  </div>`).join('')}
  </div>
</div></section>`;
}

function proof(p) {
  if (!p.proof) return '';
  return `<section id="proof"><div class="wrap">
  <p class="kicker">${esc(p.proof.kicker || 'Before you buy')}</p>
  <h2>${esc(p.proof.heading)}</h2>
  <p class="lede">${p.proof.intro}</p>
  <div class="trust">
    ${p.proof.cards.map((c) => `<div class="tcard"><div class="ic">${c.ic}</div><b>${esc(c.b)}</b><p>${esc(c.p)}</p></div>`).join('')}
  </div>
  ${p.proof.slotNote ? `<div class="todo" style="margin-top:24px"><b>Slot left empty on purpose.</b><p>${esc(p.proof.slotNote)}</p></div>` : ''}
</div></section>`;
}

function faq(p) {
  if (!p.faq || !p.faq.length) return '';
  return `<section class="tint" id="faq"><div class="wrap narrow">
  <p class="kicker">Questions</p>
  <h2>${esc(p.faqHeading || 'Common questions')}</h2>
  <div style="margin-top:24px">
  ${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join('')}
  </div>
</div></section>`;
}

function finalVerdict(p) {
  if (!p.finalVerdict) return '';
  const f = p.finalVerdict;
  return `<section id="final"><div class="wrap narrow">
  <p class="kicker">${esc(f.kicker || 'Final word')}</p>
  <h2>${esc(f.heading)}</h2>
  <p class="lede">${f.intro}</p>
  ${f.rows.map((r) => `<div class="fvrow">
    <div class="who">${esc(r.who)}<span>${esc(r.why)}</span></div>
    <a class="btn btn-navy btn-sm" href="${esc(r.url)}">${esc(r.label || 'View')}</a>
  </div>`).join('')}
</div></section>`;
}

function ctaband(p) {
  return `<section><div class="wrap">
  <div class="ctaband">
    <h2>${esc(p.cta.heading)}</h2>
    <p>${p.cta.text}</p>
    <a class="btn btn-gold" href="${esc(p.cta.url)}">${esc(p.cta.label)}</a>
    ${p.cta.secondaryLabel ? `<div style="margin-top:16px"><a class="btn btn-ghost" href="${esc(p.cta.secondaryUrl)}">${esc(p.cta.secondaryLabel)}</a></div>` : ''}
    <p style="margin-top:22px;font-size:.9em;color:#9fb6d8">Questions first? Call or WhatsApp ${T.phone} or email <a href="${T.mail}" style="color:#d8e4f7">megaphilip76@gmail.com</a></p>
  </div>
</div></section>`;
}

function footer(p) {
  return `<footer><div class="wrap">
  <h4>${esc(T.brand)}</h4>
  <p style="margin:0 0 14px">Hi-Tech Gadgets and Digital Services — ${T.store.replace('https://', '')}</p>
  <p style="margin:0">
    <a href="${T.tel}">${T.phone}</a> &middot;
    <a href="${T.mail}">megaphilip76@gmail.com</a> &middot;
    <a href="${T.store}">Visit the store</a>
  </p>
  <div class="disc">${p.disclosure || ''}
  <p style="margin:14px 0 0">Prices, specifications and stock were correct when this page was last checked against the
  store, and can change. Always confirm the current price on the store page before buying.
  Manufacturer figures such as battery life and noise-cancelling depth are the manufacturer's own claims.</p>
  <p style="margin:14px 0 0">&copy; ${new Date().getFullYear()} ${T.brand}. All rights reserved.</p>
  </div>
</div></footer>`;
}

function sticky(p) {
  return `<div class="sticky" id="sticky">
  <div class="lbl"><b>${esc(p.sticky.top || p.cta.heading)}</b>${esc(p.sticky.sub || '')}</div>
  <a class="btn btn-gold btn-sm" href="${esc(p.sticky.url || p.cta.url)}">${esc(p.sticky.label || p.cta.label)}</a>
</div>`;
}

const JS = `<script>
(function(){
  var s=document.getElementById('sticky');
  if(!s)return;
  var show=function(){ if(window.scrollY>620){s.classList.add('show');}else{s.classList.remove('show');} };
  window.addEventListener('scroll',show,{passive:true}); show();
})();
</script>`;

// ---------------------------------------------------------------------
// render + write
// ---------------------------------------------------------------------
function render(p) {
  return [
    head(p),
    bar(p),
    hero(p),
    verdict(p),
    ...(p.posts ? [posts(p)] : []),
    table(p),
    ...(p.shelves ? [shelves(p)] : []),
    products(p),
    gallery(p),
    guide(p),
    proof(p),
    faq(p),
    finalVerdict(p),
    ctaband(p),
    footer(p),
    sticky(p),
    JS,
    '</body></html>',
  ].join('\n');
}

function main() {
  const files = fs
    .readdirSync(DATA)
    .filter((f) => f.startsWith('page-') && f.endsWith('.json'))
    .sort();

  if (!files.length) {
    console.error('No data/page-*.json files found.');
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const built = [];

  for (const f of files) {
    const p = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
    const html = render(p);
    const dir = path.join(OUT, p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    built.push({ slug: p.slug, title: p.title, metaDescription: p.metaDescription, kind: p.kind });
    console.log(`  ✓ out/${p.slug}/index.html   ${(html.length / 1024).toFixed(0)} KB`);
  }

  // review hub — so you can click through everything from one file
  const hub = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sales pages — review hub</title><style>${CSS}
.hub{display:grid;gap:18px;grid-template-columns:1fr;margin-top:26px}
@media(min-width:760px){.hub{grid-template-columns:1fr 1fr}}
.hcard{background:#fff;border:1px solid ${T.line};border-radius:16px;padding:24px;display:flex;flex-direction:column}
.hcard .kind{font-size:.72em;letter-spacing:.08em;text-transform:uppercase;font-weight:900;color:${T.goldDark};margin:0 0 8px}
.hcard h3{margin:0 0 8px;font-size:1.16em}
.hcard p{color:${T.body};font-size:.94em;margin:0 0 18px;flex:1}
.hcard .btn{align-self:flex-start}
</style></head><body class="sb">
<div class="bar"><div class="wrap"><a class="brand" href="#">Sales pages <b>review</b></a>
<a class="btn btn-gold btn-sm" href="${T.store}">The store</a></div></div>
<div class="hero"><div class="wrap">
<span class="eyebrow">Review hub</span>
<h1>Sales pages, ready to examine</h1>
<p class="sub">Open any page below to see it full size. Each folder in <code>out/</code> is a complete
static site — drop it onto Netlify or Vercel and it is live. Nothing here is published yet.</p>
</div></div>
<section><div class="wrap">
<p class="kicker">${built.length} pages built</p>
<h2>Click through them</h2>
<div class="hub">
${built
  .map(
    (b) => `<div class="hcard"><p class="kind">${esc(b.kind || 'page')}</p>
  <h3>${esc(b.title)}</h3><p>${esc(b.metaDescription)}</p>
  <a class="btn btn-navy btn-sm" href="out/${b.slug}/index.html">Open page &rarr;</a></div>`
  )
  .join('')}
</div>
</div></section>
${footer({ disclosure: 'Review copy. Not yet published anywhere.' })}
</body></html>`;

  fs.writeFileSync(path.join(ROOT, 'review-hub.html'), hub);
  console.log(`\n  ✓ review-hub.html — open this to review everything\n`);
  console.log(`Built ${built.length} page(s).`);
}

main();
