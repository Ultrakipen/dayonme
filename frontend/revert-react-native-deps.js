const fs = require('fs');
const path = require('path');

// Find all build.gradle files in node_modules that contain React Native modules
const nodeModulesPath = './node_modules';
const modulePatterns = [
  'react-native-async-storage',
  'react-native-community',  
  'react-native-documents',
  'react-native-gesture-handler',
  'react-native-image-picker',
  'react-native-linear-gradient',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  'react-native-vector-icons'
];

function findModuleDirs(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (pattern.some(p => item.includes(p))) {
      const androidBuildFile = path.join(dir, item, 'android', 'build.gradle');
      if (fs.existsSync(androidBuildFile)) {
        results.push(androidBuildFile);
      }
    }
  }
  return results;
}

const buildFiles = findModuleDirs(nodeModulesPath, modulePatterns);

// Also add scoped packages
const scopedFiles = [
  'node_modules/@react-native-async-storage/async-storage/android/build.gradle',
  'node_modules/@react-native-community/datetimepicker/android/build.gradle',
  'node_modules/@react-native-documents/picker/android/build.gradle'
];

buildFiles.push(...scopedFiles.filter(f => fs.existsSync(f)));

console.log('Found build.gradle files:', buildFiles);

for (const buildFile of buildFiles) {
  try {
    let content = fs.readFileSync(buildFile, 'utf8');
    let modified = false;
    
    // Revert project dependency back to Maven dependency
    if (content.includes('implementation project(":ReactAndroid")')) {
      content = content.replace(
        /implementation project\(":ReactAndroid"\)/g,
        "implementation 'com.facebook.react:react-native:+'"
      );
      modified = true;
      console.log(`Reverted project dependency in: ${buildFile}`);
    }
    
    if (content.includes('implementation project(\':ReactAndroid\')')) {
      content = content.replace(
        /implementation project\(':ReactAndroid'\)/g,
        "implementation 'com.facebook.react:react-native:+'"
      );
      modified = true;
      console.log(`Reverted project dependency (single quotes) in: ${buildFile}`);
    }
    
    if (modified) {
      fs.writeFileSync(buildFile, content);
      console.log(`✓ Reverted: ${buildFile}`);
    }
  } catch (error) {
    console.error(`Error processing ${buildFile}:`, error.message);
  }
}

console.log('Done!');