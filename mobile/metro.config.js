const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const padrao = getDefaultConfig(__dirname);
const pacotes = path.resolve(__dirname, '../packages');

// Os pacotes compartilhados (packages/*) entram por link; o Metro precisa observá-los e
// resolver as dependências deles a partir do node_modules do app.
// SVGs viram componentes (react-native-svg-transformer): ícones e logos do design system.
module.exports = mergeConfig(padrao, {
  watchFolders: [pacotes, path.resolve(__dirname, '../design-system/logos'), path.resolve(__dirname, '../dados')],
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer/react-native'),
  },
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    assetExts: padrao.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...padrao.resolver.sourceExts, 'svg'],
    unstable_enableSymlinks: true,
  },
});
