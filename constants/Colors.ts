export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
  author: {
    primary: '#4F46E5', // Indigo
    secondary: '#818CF8',
    background: '#F5F3FF',
    text: '#312E81',
  },
  reader: {
    primary: '#2D6A6A', // Deep Teal - Primary actions/text
    secondary: '#D4E8E8', // Soft Sage - Accents/Highlights
    background: '#FFFFFF', // Pure White - Clean
    surface: '#FFFFFF', // White - Cards
    text: '#2D6A6A', // Deep Teal - Primary Text
    textSecondary: '#5A8A8A', // Medium Teal - Secondary Text
    textLight: '#FFFFFF', // White - Text on Primary Buttons
    border: '#C5DEDE', // Light Sage border
    accent: '#4A9090', // Brighter Teal for highlights
  },

  // Clean Magic Theme (White & Wine Berry)
  classic: {
    primary: '#511545', // Wine Berry (Deep Plum) - Actions/Text
    secondary: '#FBDBDE', // Azalea (Soft Pink) - Accents/Highlights (Author mode)
    background: '#FFFFFF', // Pure White - Main Clean Background
    surface: '#FFFFFF', // White - Cards/Inputs
    text: '#511545', // Wine Berry - Primary Text
    textSecondary: '#8E487F', // Lighter Plum - Secondary Text
    textLight: '#FFFFFF', // White - Text on Primary Buttons
    border: '#FBDBDE', // Azalea for subtle borders
    error: '#E53E3E',

    // Reader Mode Accent (Soft Blue instead of Azalea)
    readerAccent: '#C5D4E8', // Soft Blue - Reader highlights
    readerBorder: '#B8CAE0', // Slightly deeper blue for borders

    // Clarity Status Colors (On-Brand)
    clarityReady: '#511545', // Wine Berry - Ready/Complete
    clarityGood: '#8E487F', // Lighter Plum - Good progress
    clarityNeedsWork: '#C97B89', // Soft Rose - Needs attention

    // Brand Identity
    brand: {
      bg: '#FFFFFF',
      fg: '#511545',
    }
  }
};

export default Colors;
