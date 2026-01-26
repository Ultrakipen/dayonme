/**
 * any 타입 → 구체적 타입 자동 변환 스크립트
 */
const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // catch (error: any) → catch (error: unknown)
  { from: /catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g, to: 'catch ($1: unknown)' },

  // error: any → error: Error | unknown
  { from: /(\w+)Error:\s*any/g, to: '$1Error: Error | unknown' },

  // style?: any → style?: StyleProp<ViewStyle>
  { from: /style\?\s*:\s*any/g, to: 'style?: StyleProp<ViewStyle>' },

  // containerStyle?: any → containerStyle?: StyleProp<ViewStyle>
  { from: /containerStyle\?\s*:\s*any/g, to: 'containerStyle?: StyleProp<ViewStyle>' },

  // theme: any → theme: ThemeColors
  { from: /\(theme:\s*any\)/g, to: '(theme: ThemeColors)' },
  { from: /theme:\s*any,/g, to: 'theme: ThemeColors,' },

  // data: any → data: unknown
  { from: /data:\s*any\b/g, to: 'data: unknown' },

  // response: any → response: unknown
  { from: /response:\s*any\b/g, to: 'response: unknown' },

  // result: any → result: unknown
  { from: /result:\s*any\b/g, to: 'result: unknown' },

  // params: any → params: Record<string, unknown>
  { from: /params:\s*any\b/g, to: 'params: Record<string, unknown>' },

  // props: any → props: Record<string, unknown>
  { from: /props:\s*any\b/g, to: 'props: Record<string, unknown>' },

  // options: any → options: Record<string, unknown>
  { from: /options:\s*any\b/g, to: 'options: Record<string, unknown>' },

  // event: any → event: NativeSyntheticEvent<...>
  { from: /\(event:\s*any\)/g, to: '(event: NativeSyntheticEvent<NativeScrollEvent>)' },

  // Array<any> → unknown[]
  { from: /Array<any>/g, to: 'unknown[]' },

  // any[] → unknown[]
  { from: /:\s*any\[\]/g, to: ': unknown[]' },

  // Promise<any> → Promise<unknown>
  { from: /Promise<any>/g, to: 'Promise<unknown>' },

  // Record<string, any> → Record<string, unknown>
  { from: /Record<string,\s*any>/g, to: 'Record<string, unknown>' },

  // {[key: string]: any} → Record<string, unknown>
  { from: /\{\s*\[key:\s*string\]\s*:\s*any\s*\}/g, to: 'Record<string, unknown>' },

  // : any; → : unknown;
  { from: /:\s*any;/g, to: ': unknown;' },

  // as any → as unknown
  { from: /as\s+any\b/g, to: 'as unknown' },
];

// 필요한 import 추가 목록
const IMPORTS_NEEDED = {
  'StyleProp<ViewStyle>': "import { StyleProp, ViewStyle } from 'react-native';",
  'ThemeColors': "import { ThemeColors } from '../theme/ModernThemeContext';",
  'NativeSyntheticEvent': "import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';",
};

let totalReplacements = 0;
let filesModified = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;

  REPLACEMENTS.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      fileReplacements += matches.length;
    }
  });

  if (fileReplacements > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalReplacements += fileReplacements;
    filesModified++;
    console.log(`✅ ${path.basename(filePath)}: ${fileReplacements}개 타입 수정`);
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

console.log('🔧 any 타입 수정 시작...\n');
walkDir(path.join(__dirname, '../src'));
console.log(`\n✨ 완료: ${filesModified}개 파일, ${totalReplacements}개 타입 수정`);
