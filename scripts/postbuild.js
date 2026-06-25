const fs = require('fs');
const path = require('path');

const srcStatic = path.join(__dirname, '../.next/static');
const destStatic = path.join(__dirname, '../.next/standalone/.next/static');
const srcPublic = path.join(__dirname, '../public');
const destPublic = path.join(__dirname, '../.next/standalone/public');

try {
  console.log('Copying static assets to standalone folder...');
  if (fs.existsSync(srcStatic)) {
    fs.cpSync(srcStatic, destStatic, { recursive: true });
    console.log('Successfully copied .next/static to .next/standalone/.next/static');
  } else {
    console.warn('.next/static does not exist, skipping.');
  }

  if (fs.existsSync(srcPublic)) {
    fs.cpSync(srcPublic, destPublic, { recursive: true });
    console.log('Successfully copied public to .next/standalone/public');
  } else {
    console.warn('public/ does not exist, skipping.');
  }
} catch (err) {
  console.error('Error during postbuild copy:', err);
  process.exit(1);
}
