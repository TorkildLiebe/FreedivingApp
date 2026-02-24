type ColorScale = {
  50: string;
  100: string;
  200?: string;
  300?: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800?: string;
  900?: string;
  950?: string;
};

type Colors = {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: ColorScale;
};

export const colors: Colors = {
  // Emerald — buttons, CTAs, active states, FAB
  primary: {
    50: "#ecfdf5",
    100: "#d1fae5",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
  },

  // Teal — secondary actions, visibility badges, parking markers
  secondary: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
  },

  // Stone — backgrounds, text, borders, frosted glass
  neutral: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09",
  },
};
