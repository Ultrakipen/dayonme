const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceImage = path.join(__dirname, '../src/assets/images/app-icon.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Android mipmap sizes for legacy icons
const androidSizes = [
  { folder: 'mipmap-mdpi', size: 48, foregroundSize: 108 },
  { folder: 'mipmap-hdpi', size: 72, foregroundSize: 162 },
  { folder: 'mipmap-xhdpi', size: 96, foregroundSize: 216 },
  { folder: 'mipmap-xxhdpi', size: 144, foregroundSize: 324 },
  { folder: 'mipmap-xxxhdpi', size: 192, foregroundSize: 432 },
];

async function generateAndroidIcons() {
  console.log('Generating Android app icons...\n');

  for (const { folder, size, foregroundSize } of androidSizes) {
    const outputPath = path.join(androidResPath, folder);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Generate legacy square icon
    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputPath, 'ic_launcher.png'));

    // Generate legacy round icon
    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputPath, 'ic_launcher_round.png'));

    // Generate Adaptive Icon foreground (larger, with padding)
    // The logo should fill ~66% of the foreground for safe zone
    const logoSize = Math.round(foregroundSize * 0.70);
    const padding = Math.round((foregroundSize - logoSize) / 2);

    await sharp(sourceImage)
      .resize(logoSize, logoSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 123, g: 140, b: 222, alpha: 1 } // #7B8CDE
      })
      .png()
      .toFile(path.join(outputPath, 'ic_launcher_foreground.png'));

    console.log(`✓ ${folder}: icon ${size}x${size}, foreground ${foregroundSize}x${foregroundSize}`);
  }

  console.log('\n✅ Android icons generated successfully!');
  console.log('   - Legacy icons (ic_launcher.png)');
  console.log('   - Adaptive foregrounds (ic_launcher_foreground.png)');
}

generateAndroidIcons().catch(console.error);
