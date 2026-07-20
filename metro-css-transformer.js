const path = require('path');

// The transformer file isn't in react-native-css's exports map, so resolve it
// by absolute path.
const pkgDir = path.dirname(require.resolve('react-native-css/package.json'));
// eslint-disable-next-line import/no-dynamic-require
const upstream = require(path.join(pkgDir, 'dist/commonjs/metro/metro-transformer.js'));

/**
 * react-native-css 3.0.7 reads its compiler options from the per-file
 * transform options (5th argument), but Metro delivers `withNativewind`'s
 * options on the transformer config (1st argument). The result is that
 * `inlineVariables: false` never reaches the compiler, CSS variables get
 * inlined to their light values at build time, and dark mode never applies.
 * Re-attach the options where the upstream transformer looks for them.
 */
module.exports.transform = function transform(config, projectRoot, filePath, data, options) {
  return upstream.transform(config, projectRoot, filePath, data, {
    ...options,
    reactNativeCSS: options.reactNativeCSS ?? config.reactNativeCSS,
  });
};
