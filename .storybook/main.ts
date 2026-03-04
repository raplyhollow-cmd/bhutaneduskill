/**
 * STORYBOOK CONFIGURATION
 *
 * Design system documentation and component stories
 */

import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => {
        return (
          prop.parent ? !/node_modules/.test(prop.parent.fileName) : true
        );
      },
    },
  },
  webpackFinal: async (config) => {
    // Add aliases for clean imports
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        "@": "/src",
      },
    };
    return config;
  },
};

export default config;
