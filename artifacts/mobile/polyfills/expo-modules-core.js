// Polyfill for expo-modules-core registerWebModule
// This fixes the "(0 , _expoModulesCore.registerWebModule) is not a function" error on web

if (typeof window !== 'undefined' && !globalThis.expo?.modules) {
  globalThis.expo = globalThis.expo || {};
  globalThis.expo.modules = globalThis.expo.modules || {};
}

if (typeof window !== 'undefined' && typeof globalThis.expo !== 'undefined') {
  // Ensure the expo global is properly initialized
  if (!globalThis.expo.NativeModule) {
    globalThis.expo.NativeModule = class NativeModule {
      __expo_module_name__ = 'Unknown';
    };
  }
}