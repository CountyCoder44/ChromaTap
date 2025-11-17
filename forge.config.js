const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'assets', 'ChromaTap.ico'),
    name: 'ChromaTap',
    executableName: 'ChromaTap',
    out: 'out',
    overwrite: true,
    afterCopy: [
      async (buildPath, electronVersion, platform, arch) => {
        const rcedit = require('rcedit');
        const path = require('path');
        const exePath = path.join(buildPath, 'ChromaTap.exe');
        const iconPath = path.join(__dirname, 'assets', 'ChromaTap.ico');
        
        await new Promise((resolve, reject) => {
          rcedit(exePath, {
            icon: iconPath,
          }, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        // This doesn't add extra folder unfortunately, we'll need to do it manually
      }
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
