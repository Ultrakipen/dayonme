/**
 * any 타입 → 구체적 타입 안전 변환 (catch 문만)
 */
const fs = require('fs');
const path = require('path');

let totalReplacements = 0;
let filesModified = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;

  // catch (error: any) → catch (error: unknown)만 변환
  const regex = /catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g;
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, 'catch ($1: unknown)');
    fileReplacements = matches.length;
  }

  if (fileReplacements > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalReplacements += fileReplacements;
    filesModified++;
    console.log(`✅ ${path.basename(filePath)}: ${fileReplacements}개`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules')) {
      walkDir(filePath);
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.endsWith('.d.ts')) {
      processFile(filePath);
    }
  });
}

console.log('🔧 catch any → unknown 변환...\n');
walkDir(path.join(__dirname, '../src'));
console.log(`\n✨ 완료: ${filesModified}개 파일, ${totalReplacements}개 수정`);
