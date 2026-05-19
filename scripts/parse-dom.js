const fs = require('fs');
const html = fs.readFileSync('dom-snapshots/04-post-login.html', 'utf8');

// Search for text nodes containing plan/account/membership heading
const headingPatterns = [
  /class="[^"]*title[^"]*"[^>]*>[^<]{0,80}/gi,
  /class="[^"]*heading[^"]*"[^>]*>[^<]{0,80}/gi,
  /class="[^"]*page-title[^"]*"[^>]*>[^<]{0,80}/gi,
  /nav-account[^>]{0,200}/gi,
];
headingPatterns.forEach(p => {
  const m = html.match(p) || [];
  if (m.length) { console.log('\n---', p.source.substring(0,30)); m.slice(0,3).forEach(s => console.log(s.substring(0, 200))); }
});

// Find the nav title area (center text in the black navbar)
console.log('\n=== nav title / center header text ===');
(html.match(/class="[^"]*nav-title[^"]*"[^>]*>[^<]{0,80}|class="[^"]*title[^"]*"[^>]*>[\w\s]{2,60}/gi) || [])
  .slice(0,5).forEach(m => console.log(m.substring(0,200)));

// Get the full nav-account block
const navStart = html.indexOf('id="navbar"');
if (navStart !== -1) {
  console.log('\n=== full navbar HTML (first 800 chars) ===');
  console.log(html.substring(navStart, navStart + 800));
}
