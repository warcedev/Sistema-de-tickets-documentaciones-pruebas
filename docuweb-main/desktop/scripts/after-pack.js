// macOS: deja el PHP empaquetado como ejecutable y firma la app "ad-hoc"
// (sin certificado de Apple). Apple Silicon no ejecuta binarios sin ninguna
// firma; con la ad-hoc alcanza para que corra tras aprobarla en Gatekeeper.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const php = path.join(appPath, 'Contents', 'Resources', 'php', 'php');
  if (fs.existsSync(php)) fs.chmodSync(php, 0o755);

  if (process.platform === 'darwin') {
    console.log(`  • firma ad-hoc  ${appPath}`);
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', php], { stdio: 'inherit' });
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  }
};
