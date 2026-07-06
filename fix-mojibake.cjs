const fs = require('fs');
const path = require('path');

const win1252ToByte = {
  '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84, '\u2026': 0x85,
  '\u2020': 0x86, '\u2021': 0x87, '\u02C6': 0x88, '\u2030': 0x89, '\u0160': 0x8A,
  '\u2039': 0x8B, '\u0152': 0x8C, '\u017D': 0x8E, '\u2018': 0x91, '\u2019': 0x92,
  '\u201C': 0x93, '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B, '\u0153': 0x9C,
  '\u017E': 0x9E, '\u0178': 0x9F
};

function decodeMojibake(str) {
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    let code = char.charCodeAt(0);
    if (code <= 0xFF && (code < 0x80 || code >= 0xA0 || [0x81, 0x8D, 0x8F, 0x90, 0x9D].includes(code))) {
      bytes.push(code);
    } else if (win1252ToByte[char] !== undefined) {
      bytes.push(win1252ToByte[char]);
    } else {
      return str; 
    }
  }
  try {
    return Buffer.from(bytes).toString('utf8');
  } catch (e) {
    return str;
  }
}

const mojibakeRegex = /([^\x00-\x7F]+)/g;

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      let changed = false;
      let newC = c.replace(mojibakeRegex, (match) => {
        let decoded = decodeMojibake(match);
        if (decoded !== match && decoded.length < match.length && !decoded.includes('\uFFFD')) {
          changed = true;
          return decoded;
        }
        return match;
      });
      if (changed) {
        fs.writeFileSync(p, newC, 'utf8');
        console.log('Fixed mojibake in', p);
      }
    }
  });
}

walk('d:/universalSaas/src');
