import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "TB Game",
  slug: "tb-game",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "tbgame",
  userInterfaceStyle: "dark",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.tbgame.app",
  },
  android: {
    package: "com.tbgame.app",
  },
  web: {
    bundler: "metro",
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
