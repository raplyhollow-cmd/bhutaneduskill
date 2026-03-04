/**
 * STORYBOOK PREVIEW
 *
 * Global decorators and configurations
 */

import type { Preview } from "@storybook/react";
import "../src/app/globals.css";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind utility for Storybook
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#09090b",
        },
        {
          name: "gray",
          value: "#f3f4f6",
        },
      ],
    },
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
