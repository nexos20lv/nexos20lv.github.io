const fs = require('fs');

// Fix ContactForm.tsx
let cf = fs.readFileSync('components/ContactForm.tsx', 'utf8');
cf = cf.replace('Erreur r\u00c3\u00a9seau.', 'Erreur r\u00e9seau.');
cf = cf.replace('Message envoy\u00c3\u00a9 avec succ\u00c3\u00a8s !', 'Message envoy\u00e9 avec succ\u00e8s !');
fs.writeFileSync('components/ContactForm.tsx', cf, 'utf8');
console.log('ContactForm.tsx fixed');

// Re-audit everything
const path = require('path');
const exts = ['.tsx','.ts','.json','.css','.md'];
let issues = 0;
function walk(d) {
  const es = fs.readdirSync(d, { withFileTypes: true });
  for (const e of es) {
    if (['node_modules', '.next', '.git'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.includes(path.extname(e.name))) {
      const c = fs.readFileSync(p, 'utf8');
      const ls = c.split('\n');
      for (let i = 0; i < ls.length; i++) {
        const l = ls[i];
        if (/Ã|Â/.test(l)) {
          console.log('ISSUE: ' + p + ':' + (i + 1) + ': ' + l.trim().substring(0, 150));
          issues++;
        }
      }
    }
  }
}
walk('.');
if (issues === 0) console.log('\nALL FILES CLEAN - No corrupted text found!');
else console.log('\n' + issues + ' issues remaining');

