const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === '@react-native-community/datetimepicker') {
    return { type: 'sourceFile', filePath: require.resolve('./stubs/datetimepicker-web.js') };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
