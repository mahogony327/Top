const sharp = require('sharp');
const path = require('path');

const bgColor = { r: 14, g: 165, b: 233, alpha: 1 }; // #0ea5e9 (sky-500)

async function generateIcons() {
  // App icon (1024x1024)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: bgColor
    }
  })
    .png()
    .toFile(path.join(__dirname, 'assets', 'icon.png'));
  
  // Adaptive icon foreground (1024x1024)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: bgColor
    }
  })
    .png()
    .toFile(path.join(__dirname, 'assets', 'adaptive-icon.png'));
  
  // Splash screen (1284x2778)
  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: bgColor
    }
  })
    .png()
    .toFile(path.join(__dirname, 'assets', 'splash.png'));
  
  // Favicon (48x48)
  await sharp({
    create: {
      width: 48,
      height: 48,
      channels: 4,
      background: bgColor
    }
  })
    .png()
    .toFile(path.join(__dirname, 'assets', 'favicon.png'));
  
  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
