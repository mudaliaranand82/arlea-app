/**
 * ARLEA Design System - Brutalist Style
 * Based on priv.fi design patterns
 * 
 * Key principles:
 * - Neo-brutalist aesthetic with bold black borders (3-4px)
 * - Hard drop shadows (no blur) offset by 4-8px
 * - Sharp corners (no border radius on buttons)
 * - High contrast color scheme
 * - Tactile button press animations
 * - Cyan ripple click effect
 */

// Design Tokens
export const DesignTokens = {
    colors: {
        primary: '#511545',      // Wine Berry (instead of priv.fi orange #D94826)
        primaryDark: '#3D1033',  // Darker Wine Berry
        accent: '#3DD8DD',       // Cyan/turquoise for ripple effects
        background: '#FFFFFF',
        backgroundDark: '#0A0A0A',
        text: '#000000',
        textLight: '#666666',
        textOnPrimary: '#FFFFFF',
        border: '#000000',
        modalOverlay: 'rgba(0, 0, 0, 0.6)',
    },

    fonts: {
        primary: 'Outfit',
        mono: 'SpaceMono',
    },

    fontWeights: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },

    borders: {
        thin: 2,
        regular: 3,
        thick: 4,
    },

    shadows: {
        // Hard offset shadows (no blur)
        small: {
            offset: { width: 3, height: 3 },
            color: '#000000',
            opacity: 1,
            radius: 0,
        },
        medium: {
            offset: { width: 4, height: 4 },
            color: '#000000',
            opacity: 1,
            radius: 0,
        },
        large: {
            offset: { width: 8, height: 8 },
            color: '#000000',
            opacity: 1,
            radius: 0,
        },
        card: {
            offset: { width: 6, height: 6 },
            color: '#000000',
            opacity: 1,
            radius: 0,
        },
    },

    animation: {
        fast: 150,
        normal: 220,
        slow: 300,
        ripple: 600,
    },

    // Button press animation values
    buttonPress: {
        // Idle state
        idle: {
            translate: { x: 0, y: 0 },
            shadowOffset: { width: 4, height: 4 },
        },
        // Hover state (halfway pressed)
        hover: {
            translate: { x: 2, y: 2 },
            shadowOffset: { width: 2, height: 2 },
        },
        // Active/Pressed state (fully pressed)
        active: {
            translate: { x: 4, y: 4 },
            shadowOffset: { width: 0, height: 0 },
        },
    },
};

// Component Styles
export const BrutalistStyles = {
    button: {
        primary: {
            backgroundColor: DesignTokens.colors.primary,
            color: DesignTokens.colors.textOnPrimary,
            borderWidth: DesignTokens.borders.regular,
            borderColor: DesignTokens.colors.border,
            borderRadius: 0, // Sharp corners
            paddingVertical: 12,
            paddingHorizontal: 24,
            fontSize: 14,
            fontWeight: DesignTokens.fontWeights.bold,
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5,
        },
        secondary: {
            backgroundColor: DesignTokens.colors.background,
            color: DesignTokens.colors.text,
            borderWidth: DesignTokens.borders.thin,
            borderColor: DesignTokens.colors.border,
            borderRadius: 0,
            paddingVertical: 10,
            paddingHorizontal: 20,
            fontSize: 14,
            fontWeight: DesignTokens.fontWeights.bold,
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5,
        },
    },

    card: {
        backgroundColor: DesignTokens.colors.background,
        borderWidth: DesignTokens.borders.thick,
        borderColor: DesignTokens.colors.border,
        borderRadius: 0, // Sharp corners for brutalist feel
        padding: DesignTokens.spacing.lg,
        ...DesignTokens.shadows.card,
    },

    cardAccent: {
        backgroundColor: DesignTokens.colors.primary,
        borderWidth: DesignTokens.borders.thick,
        borderColor: DesignTokens.colors.border,
        borderRadius: 0,
        padding: DesignTokens.spacing.lg,
        ...DesignTokens.shadows.card,
    },

    input: {
        backgroundColor: '#F5F5F5',
        borderWidth: DesignTokens.borders.regular,
        borderColor: DesignTokens.colors.border,
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 24,
        fontWeight: DesignTokens.fontWeights.bold,
        fontFamily: DesignTokens.fonts.mono,
    },

    tab: {
        inactive: {
            backgroundColor: DesignTokens.colors.background,
            color: DesignTokens.colors.textLight,
            paddingVertical: 16,
            paddingHorizontal: 32,
            fontSize: 14,
            fontWeight: DesignTokens.fontWeights.bold,
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5,
            borderRightWidth: DesignTokens.borders.regular,
            borderColor: DesignTokens.colors.border,
        },
        active: {
            backgroundColor: DesignTokens.colors.primary,
            color: DesignTokens.colors.textOnPrimary,
        },
    },

    modal: {
        overlay: {
            backgroundColor: DesignTokens.colors.modalOverlay,
        },
        container: {
            backgroundColor: DesignTokens.colors.background,
            borderWidth: DesignTokens.borders.thick,
            borderColor: DesignTokens.colors.border,
            padding: DesignTokens.spacing.xl,
            maxWidth: 480,
            ...DesignTokens.shadows.large,
        },
    },
};

export default { DesignTokens, BrutalistStyles };
