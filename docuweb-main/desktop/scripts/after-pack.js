// Ajustes después de empaquetar:
//  - macOS: deja el PHP como ejecutable y firma la app "ad-hoc" (sin
//    certificado de Apple). Apple Silicon no ejecuta binarios sin ninguna
//    firma; con la ad-hoc alcanza para que corra tras aprobarla en Gatekeeper.
//  - Windows: pone el ícono de DOCWeb en DOCWeb.exe con resedit (JS puro),
//    así funciona también al armar desde Mac/Linux sin Wine.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ICON_ICO = path.join(__dirname, '..', 'build-resources', 'icon.ico');

async function setWindowsIcon(exePath) {
  const ResEdit = await import('resedit');
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(ICON_ICO));

  // Reemplaza el grupo de íconos existente (el de Electron) o crea el 1.
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const target = groups[0] || { id: 1, lang: 1033 };
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    target.id,
    target.lang,
    iconFile.icons.map((i) => i.data)
  );

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
}

exports.default = async function afterPack(context) {
  const productFilename = context.packager.appInfo.productFilename;

  if (context.electronPlatformName === 'win32') {
    const exePath = path.join(context.appOutDir, `${productFilename}.exe`);
    console.log(`  • ícono Windows  ${exePath}`);
    await setWindowsIcon(exePath);
    return;
  }

  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${productFilename}.app`);
  const php = path.join(appPath, 'Contents', 'Resources', 'php', 'php');
  if (fs.existsSync(php)) fs.chmodSync(php, 0o755);

  if (process.platform === 'darwin') {
    console.log(`  • firma ad-hoc  ${appPath}`);
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', php], { stdio: 'inherit' });
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  }
};
