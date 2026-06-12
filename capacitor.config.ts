import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cash.moneyflow.moneyflow",
  appName: "Money Flow",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
