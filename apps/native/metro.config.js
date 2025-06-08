const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// Add the monorepo paths to the resolver
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

// Add support for the packages directory
config.watchFolders = [
  path.resolve(__dirname, '../../packages'),
];

module.exports = config;