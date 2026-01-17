/**
 * ARLEA Color System - Literary Luxe Edition
 *
 * A sophisticated, warm palette inspired by vintage bookstores,
 * antique libraries, and premium literary publications.
 */

export const Colors = {
    // Base theme (light mode - default)
    light: {
        text: '#1C1410',
        textSecondary: '#5C524A',
        textMuted: '#8C8078',
        background: '#FAF7F2',
        backgroundAlt: '#F4EFE6',
        surface: '#FFFFFF',
        tint: '#C9A962',
        accent: '#C9A962',
        icon: '#5C524A',
        border: '#E8E2D9',
        tabIconDefault: '#8C8078',
        tabIconSelected: '#C9A962',
    },

    // Dark theme
    dark: {
        text: '#FAF7F2',
        textSecondary: '#B8AFA5',
        textMuted: '#8C8078',
        background: '#1C1410',
        backgroundAlt: '#2D2420',
        surface: '#2D2420',
        tint: '#C9A962',
        accent: '#C9A962',
        icon: '#B8AFA5',
        border: '#3D3430',
        tabIconDefault: '#8C8078',
        tabIconSelected: '#C9A962',
    },

    // Author theme - Subtle purple tones for creators
    author: {
        primary: '#4A3B5C',           // Muted plum
        secondary: '#8B7BA0',         // Soft lavender
        accent: '#C9A962',            // Gold accent (consistent)
        background: '#FAF7F2',        // Warm parchment
        surface: '#FFFFFF',
        text: '#1C1410',
        textSecondary: '#5C524A',
        border: '#E8E2D9',
    },

    // Reader theme - Warm, inviting tones
    reader: {
        primary: '#1C1410',           // Deep espresso
        secondary: '#5C524A',         // Warm gray
        accent: '#C9A962',            // Antique gold
        background: '#FAF7F2',        // Warm parchment
        surface: '#FFFFFF',
        text: '#1C1410',
        textSecondary: '#5C524A',
        textLight: '#FAF7F2',
        border: '#E8E2D9',
    },

    // Classic/Main theme - Literary Luxe
    classic: {
        // Primary palette
        primary: '#1C1410',           // Deep Espresso
        primaryLight: '#2D2420',      // Lighter espresso
        accent: '#C9A962',            // Antique Gold
        accentDark: '#A8883E',        // Darker gold
        accentLight: '#E8D4A8',       // Pale gold

        // Backgrounds
        background: '#FAF7F2',        // Warm Parchment
        backgroundAlt: '#F4EFE6',     // Slightly darker parchment
        surface: '#FFFFFF',           // Pure white
        surfaceElevated: '#FFFDF9',   // Warm white

        // Text
        text: '#1C1410',              // Deep espresso
        textSecondary: '#5C524A',     // Warm gray
        textMuted: '#8C8078',         // Muted warm gray
        textOnDark: '#FAF7F2',        // Parchment on dark
        textLight: '#FAF7F2',         // Light text

        // Borders & Dividers
        border: '#E8E2D9',            // Warm border
        borderDark: '#D4CCC0',        // Emphasis border
        divider: '#EDE8E0',           // Subtle dividers

        // Status colors
        error: '#A54A4A',             // Muted burgundy
        success: '#4A7C59',           // Forest green
        warning: '#C9A962',           // Gold

        // Character clarity status (updated for new theme)
        clarityReady: '#4A7C59',      // Forest green - Ready/Complete
        clarityGood: '#C9A962',       // Gold - Good progress
        clarityNeedsWork: '#A54A4A',  // Burgundy - Needs attention

        // Brand identity
        brand: {
            bg: '#1C1410',            // Deep espresso
            fg: '#C9A962',            // Antique gold
        },

        // Secondary for backwards compatibility
        secondary: '#E8D4A8',         // Pale gold
        readerAccent: '#E8D4A8',      // Pale gold
        readerBorder: '#D4CCC0',      // Warm border
    },

    // Semantic colors
    semantic: {
        success: '#4A7C59',           // Forest green
        warning: '#C9A962',           // Gold
        error: '#A54A4A',             // Muted burgundy
        info: '#5B7B8C',              // Slate blue
    },

    // Gradients (as color stops)
    gradients: {
        gold: ['#C9A962', '#A8883E'],
        warmDark: ['#1C1410', '#2D2420'],
        parchment: ['#FAF7F2', '#F4EFE6'],
        sunset: ['#C9A962', '#A54A4A'],
    },

    // Special effects
    effects: {
        overlay: 'rgba(28, 20, 16, 0.7)',
        overlayLight: 'rgba(28, 20, 16, 0.4)',
        shimmer: 'rgba(201, 169, 98, 0.15)',
        glow: 'rgba(201, 169, 98, 0.25)',
        shadow: 'rgba(28, 20, 16, 0.1)',
    },
};

export default Colors;
