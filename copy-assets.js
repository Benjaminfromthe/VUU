import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy all .html files from root to dist
const files = fs.readdirSync(process.cwd());
files.forEach(file => {
  if (file.endsWith('.html')) {
    fs.copyFileSync(path.join(process.cwd(), file), path.join(distDir, file));
    console.log(`Copied ${file} to dist/`);
  }
});

// Copy style.css from root to dist
const styleSrc = path.join(process.cwd(), 'style.css');
if (fs.existsSync(styleSrc)) {
  fs.copyFileSync(styleSrc, path.join(distDir, 'style.css'));
  console.log('Copied style.css to dist/');
}

// Copy public directory recursive if it exists
const publicDirSrc = path.join(process.cwd(), 'public');
const publicDirDst = path.join(distDir, 'public');
if (fs.existsSync(publicDirSrc)) {
  if (!fs.existsSync(publicDirDst)) {
    fs.mkdirSync(publicDirDst, { recursive: true });
  }
  
  const copyFolderRecursive = (src, dest) => {
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
         if (!fs.existsSync(destPath)) {
           fs.mkdirSync(destPath, { recursive: true });
         }
         copyFolderRecursive(srcPath, destPath);
      } else {
         fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  copyFolderRecursive(publicDirSrc, publicDirDst);
  console.log('Copied public/ assets to dist/public/');
}

console.log('Full build packaging of static files is successful.');
