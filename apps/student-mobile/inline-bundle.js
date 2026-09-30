import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const assetsDir = path.join(distDir, 'assets');
const androidWwwDir = path.resolve(__dirname, 'android/app/src/main/assets/www');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found!');
  process.exit(1);
}

let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Find JS bundle in dist/assets
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.endsWith('.js'));
  if (jsFile) {
    const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
    console.log(`Found JS bundle: ${jsFile} (${jsContent.length} bytes)`);

    // Remove original script tag from wherever it is (e.g. head)
    html = html.replace(/<script\s+type="module"\s+crossorigin\s+src="[^"]+"><\/script>/, '');

    // Insert inline script at the bottom of <body> AFTER <div id="root"></div> safely without $ pattern expansion
    const scriptBlock = `<script>\n${jsContent}\n</script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', () => `${scriptBlock}\n</body>`);
    } else {
      html += `\n${scriptBlock}`;
    }
    console.log('Successfully inlined JS bundle at bottom of <body> after #root');
  }
}

fs.writeFileSync(indexHtmlPath, html, 'utf8');

// Also copy to android/app/src/main/assets/www
if (!fs.existsSync(androidWwwDir)) {
  fs.mkdirSync(androidWwwDir, { recursive: true });
}

// Copy index.html
fs.writeFileSync(path.join(androidWwwDir, 'index.html'), html, 'utf8');

// Clean and copy assets directory if present
const androidAssetsDir = path.join(androidWwwDir, 'assets');
if (fs.existsSync(androidAssetsDir)) {
  fs.rmSync(androidAssetsDir, { recursive: true, force: true });
}
fs.mkdirSync(androidAssetsDir, { recursive: true });

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  for (const f of files) {
    fs.copyFileSync(path.join(assetsDir, f), path.join(androidAssetsDir, f));
  }
}

console.log(`Synced web assets to ${androidWwwDir}. Single-file index.html size: ${html.length} bytes.`);
