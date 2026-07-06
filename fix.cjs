const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('â€”')) {
        fs.writeFileSync(p, c.replace(/â€”/g, '-'), 'utf8');
        console.log('Fixed', p);
      }
    }
  });
}

walk('d:/universalSaas/src');
