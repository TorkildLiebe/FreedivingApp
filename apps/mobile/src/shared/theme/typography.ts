import { TextStyle } from 'react-native';

type TypographyVariant = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight'>;

type Typography = {
  h1: TypographyVariant;
  h2: TypographyVariant;
  h3: TypographyVariant;
  body: TypographyVariant;
  bodySmall: TypographyVariant;
  bodyBold: TypographyVariant;
  mono: TypographyVariant;
  monoBold: TypographyVariant;
};

// Custom font variants — require useFonts to be loaded in _layout.tsx
// Keys match the FontFamily-Weight naming convention registered via useFonts
export const typography: Typography = {
  h1: { fontFamily: 'SpaceGrotesk-700', fontSize: 32, lineHeight: 40, fontWeight: '700' },
  h2: { fontFamily: 'SpaceGrotesk-600', fontSize: 28, lineHeight: 34, fontWeight: '600' },
  h3: { fontFamily: 'SpaceGrotesk-500', fontSize: 24, lineHeight: 30, fontWeight: '500' },
  body: { fontFamily: 'Inter-400', fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodySmall: { fontFamily: 'Inter-400', fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodyBold: { fontFamily: 'Inter-700', fontSize: 16, lineHeight: 24, fontWeight: '700' },
  mono: { fontFamily: 'IBMPlexMono-400', fontSize: 14, lineHeight: 20, fontWeight: '400' },
  monoBold: { fontFamily: 'IBMPlexMono-500', fontSize: 14, lineHeight: 20, fontWeight: '500' },
};

// System-font fallback variants — used when font loading fails
export const typographyFallback: Typography = {
  h1: { fontFamily: 'System', fontSize: 32, lineHeight: 40, fontWeight: '700' },
  h2: { fontFamily: 'System', fontSize: 28, lineHeight: 34, fontWeight: '600' },
  h3: { fontFamily: 'System', fontSize: 24, lineHeight: 30, fontWeight: '500' },
  body: { fontFamily: 'System', fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodySmall: { fontFamily: 'System', fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodyBold: { fontFamily: 'System', fontSize: 16, lineHeight: 24, fontWeight: '700' },
  mono: { fontFamily: 'Courier New', fontSize: 14, lineHeight: 20, fontWeight: '400' },
  monoBold: { fontFamily: 'Courier New', fontSize: 14, lineHeight: 20, fontWeight: '500' },
};
