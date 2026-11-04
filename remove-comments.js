import fs from 'fs';
import path from 'path';

function removeCommentsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Remove // comments
  let newContent = content.replace(/\/\/.*$/gm, '');
  // Remove /* */ comments
  newContent = newContent.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove empty lines
  newContent = newContent.replace(/^\s*\n/gm, '');
  fs.writeFileSync(filePath, newContent);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      removeCommentsFromFile(filePath);
    }
  }
}

processDirectory('./src');