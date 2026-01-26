/**
 * 하드코딩 색상 → 테마 색상 자동 마이그레이션 스크립트
 */
const fs = require('fs');
const path = require('path');

// 색상 매핑 (하드코딩 → 테마)
const COLOR_MAP = {
  // 흰색/배경
  "'#FFFFFF'": "theme.colors.card",
  "'#ffffff'": "theme.colors.card",
  "'#FFF'": "theme.colors.card",
  "'#fff'": "theme.colors.card",
  "'#FAFAFA'": "theme.colors.background",
  "'#fafafa'": "theme.colors.background",
  "'#F5F5F5'": "theme.colors.surface",
  "'#f5f5f5'": "theme.colors.surface",
  "'#F8F8F8'": "theme.colors.background",
  "'#F9FAFB'": "theme.colors.background",

  // 검정/텍스트
  "'#000000'": "theme.colors.text.primary",
  "'#000'": "theme.colors.text.primary",
  "'#1A1A1A'": "theme.colors.text.primary",
  "'#111827'": "theme.colors.text.primary",
  "'#333333'": "theme.colors.text.primary",
  "'#333'": "theme.colors.text.primary",
  "'#374151'": "theme.colors.text.primary",

  // 회색 (보조 텍스트)
  "'#666666'": "theme.colors.text.secondary",
  "'#666'": "theme.colors.text.secondary",
  "'#6B7280'": "theme.colors.text.secondary",
  "'#9CA3AF'": "theme.colors.text.tertiary",
  "'#999999'": "theme.colors.text.tertiary",
  "'#999'": "theme.colors.text.tertiary",
  "'#AAAAAA'": "theme.colors.text.tertiary",

  // 테두리
  "'#E5E5E5'": "theme.colors.border",
  "'#E5E7EB'": "theme.colors.border",
  "'#EEEEEE'": "theme.colors.border",
  "'#eee'": "theme.colors.border",
  "'#D1D5DB'": "theme.colors.border",

  // 다크모드 배경
  "'#121212'": "theme.colors.background",
  "'#1E1E1E'": "theme.colors.surface",
  "'#262626'": "theme.colors.card",
  "'#2D2D2D'": "theme.colors.card",

  // 프라이머리
  "'#0EA5E9'": "theme.colors.primary",
  "'#0ea5e9'": "theme.colors.primary",
  "'#3B82F6'": "theme.colors.primary",
  "'#2563EB'": "theme.colors.primary",

  // 에러/위험
  "'#EF4444'": "theme.colors.error",
  "'#ef4444'": "theme.colors.error",
  "'#DC2626'": "theme.colors.error",
  "'#FF0000'": "theme.colors.error",
  "'#F44336'": "theme.colors.error",

  // 성공
  "'#22C55E'": "theme.colors.success",
  "'#10B981'": "theme.colors.success",
  "'#4CAF50'": "theme.colors.success",

  // 경고
  "'#F59E0B'": "theme.colors.warning",
  "'#FFA500'": "theme.colors.warning",
};

// 큰따옴표 버전 추가
Object.keys(COLOR_MAP).forEach(key => {
  const doubleQuoteKey = key.replace(/'/g, '"');
  COLOR_MAP[doubleQuoteKey] = COLOR_MAP[key];
});

let totalReplacements = 0;
let filesModified = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;

  // 이미 theme.colors를 사용하는 파일은 부분 마이그레이션
  Object.entries(COLOR_MAP).forEach(([oldColor, newColor]) => {
    const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newColor);
      fileReplacements += matches.length;
    }
  });

  if (fileReplacements > 0 && content !== originalContent) {
    // useModernTheme import 확인 및 추가
    if (!content.includes('useModernTheme') && content.includes('theme.colors')) {
      const importMatch = content.match(/import.*from\s+['"]react['"];?\n/);
      if (importMatch) {
        const insertPos = importMatch.index + importMatch[0].length;
        content = content.slice(0, insertPos) +
          "import { useModernTheme } from '../theme/ModernThemeContext';\n" +
          content.slice(insertPos);
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    totalReplacements += fileReplacements;
    filesModified++;
    console.log(`✅ ${path.basename(filePath)}: ${fileReplacements}개 색상 변환`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules')) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('🎨 색상 마이그레이션 시작...\n');
walkDir(path.join(__dirname, '../src'));
console.log(`\n✨ 완료: ${filesModified}개 파일, ${totalReplacements}개 색상 변환`);
