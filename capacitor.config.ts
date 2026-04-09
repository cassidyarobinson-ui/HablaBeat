import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hablabeat.app',
  appName: 'HablaBeat',
  webDir: 'out',
  server: {
    // Allow loading external audio and images
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
  },
};

export default config;
