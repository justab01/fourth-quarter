const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix for "registerWebModule is not a function" error on web
// Keep class names for Expo modules to prevent minification issues
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    keep_classnames: /^(Expo|NativeModule)/,
  },
};

module.exports = config;
