// Extract script blocks and validate JS syntax using Node
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../download/placement_tracker.html'), 'utf8');

const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/g;
let m, idx = 0, allOk = true;
while ((m = scriptRe.exec(html)) !== null) {
  const code = m[1];
  idx++;
  if (!code.trim()) { console.log(`script[${idx}]: empty`); continue; }
  try {
    new vm.Script(code, { filename: `script[${idx}].js` });
    console.log(`script[${idx}]: valid JS (${code.length} chars)`);
  } catch (e) {
    allOk = false;
    console.log(`script[${idx}]: ERROR -> ${e.message}`);
  }
}
console.log(allOk ? '\nALL SCRIPT BLOCKS VALID' : '\nERRORS FOUND');
