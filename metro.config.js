const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const nativewindConfig = withNativewind(config, {
  // inline variables break PlatformColor in CSS variables, and inlining bakes
  // the light-mode values into every rule so dark mode never applies
  inlineVariables: false,
  // We add className support manually
  globalClassNamePolyfill: false,
});

// react-native-css 3.0.7 loses the options above on their way to the CSS
// compiler (it reads them from the wrong Metro argument), so route the
// transform through a wrapper that re-attaches them. See metro-css-transformer.js.
nativewindConfig.transformerPath = require.resolve('./metro-css-transformer');

module.exports = nativewindConfig;
