/**
 * ARLEA Design System - Literary Luxe Edition
 *
 * An elegant, editorial aesthetic inspired by premium bookstores
 * and literary magazines. Warm, sophisticated, and inviting.
 *
 * Key principles:
 * - Elegant serif typography (Playfair Display + Lora)
 * - Warm, paper-like backgrounds with subtle textures
 * - Gold/bronze accents on deep, rich backgrounds
 * - Generous whitespace and editorial layouts
 * - Refined micro-interactions with tasteful motion
 * - Layered depth through subtle shadows and overlays
 */

// Design Tokens
export const DesignTokens = {
    colors: {
        // Primary palette - Rich, literary tones
        primary: '#1C1410',          // Deep Espresso - primary text/actions
        primaryLight: '#2D2420',     // Lighter espresso for hover states
        accent: '#C9A962',           // Antique Gold - highlights & CTAs
        accentDark: '#A8883E',       // Darker gold for pressed states
        accentLight: '#E8D4A8',      // Pale gold for subtle accents

        // Backgrounds - Warm, paper-like
        background: '#FAF7F2',       // Warm Parchment - main background
        backgroundDark: '#1C1410',   // Deep Espresso - dark sections
        backgroundAlt: '#F4EFE6',    // Slightly darker parchment
        surface: '#FFFFFF',          // Pure white for cards
        surfaceElevated: '#FFFDF9',  // Slightly warm white

        // Text hierarchy
        text: '#1C1410',             // Deep Espresso - body text
        textSecondary: '#5C524A',    // Warm Gray - secondary text
        textMuted: '#8C8078',        // Muted warm gray
        textOnDark: '#FAF7F2',       // Parchment on dark
        textOnAccent: '#1C1410',     // Dark text on gold

        // Semantic colors
        border: '#E8E2D9',           // Warm border
        borderDark: '#D4CCC0',       // Darker border for emphasis
        divider: '#EDE8E0',          // Subtle dividers

        // Status colors
        success: '#4A7C59',          // Forest green
        warning: '#C9A962',          // Gold (same as accent)
        error: '#A54A4A',            // Muted burgundy
        info: '#5B7B8C',             // Slate blue

        // Special effects
        overlay: 'rgba(28, 20, 16, 0.7)',      // Dark overlay
        overlayLight: 'rgba(28, 20, 16, 0.4)', // Lighter overlay
        shimmer: 'rgba(201, 169, 98, 0.15)',   // Gold shimmer
        glow: 'rgba(201, 169, 98, 0.25)',      // Gold glow
    },

    fonts: {
        // Serif for headings - elegant and distinctive
        display: 'PlayfairDisplay',
        displayItalic: 'PlayfairDisplay-Italic',

        // Serif for body - highly readable
        body: 'Lora',
        bodyItalic: 'Lora-Italic',

        // Sans for UI elements - clean and modern
        ui: 'Raleway',

        // Monospace for code/special
        mono: 'JetBrainsMono',
    },

    fontWeights: {
        light: '300' as const,
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        black: '900' as const,
    },

    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        md: 18,
        lg: 20,
        xl: 24,
        '2xl': 32,
        '3xl': 40,
        '4xl': 48,
        '5xl': 64,
        display: 72,
    },

    lineHeight: {
        tight: 1.1,
        snug: 1.25,
        normal: 1.5,
        relaxed: 1.625,
        loose: 1.8,
    },

    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
        widest: 2,
        display: 3,    // For large display text
        caps: 4,       // For uppercase labels
    },

    spacing: {
        '2xs': 2,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
        '3xl': 64,
        '4xl': 96,
        '5xl': 128,
    },

    radius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        '2xl': 24,
        full: 9999,
    },

    borders: {
        thin: 1,
        regular: 1.5,
        thick: 2,
    },

    shadows: {
        // Soft, elegant shadows
        subtle: {
            shadowColor: '#1C1410',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
        },
        soft: {
            shadowColor: '#1C1410',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
        },
        medium: {
            shadowColor: '#1C1410',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 4,
        },
        elevated: {
            shadowColor: '#1C1410',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 8,
        },
        dramatic: {
            shadowColor: '#1C1410',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.15,
            shadowRadius: 32,
            elevation: 16,
        },
        // Gold glow for special elements
        glow: {
            shadowColor: '#C9A962',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 4,
        },
        innerGlow: {
            shadowColor: '#C9A962',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 0,
        },
    },

    animation: {
        instant: 100,
        fast: 200,
        normal: 300,
        smooth: 400,
        slow: 500,
        dramatic: 800,

        // Easing curves
        easing: {
            easeOut: [0.16, 1, 0.3, 1],
            easeInOut: [0.65, 0, 0.35, 1],
            spring: [0.34, 1.56, 0.64, 1],
            gentle: [0.4, 0, 0.2, 1],
        },
    },

    // Button interaction states
    buttonStates: {
        idle: {
            scale: 1,
            opacity: 1,
        },
        hover: {
            scale: 1.02,
            opacity: 1,
        },
        pressed: {
            scale: 0.98,
            opacity: 0.9,
        },
        disabled: {
            scale: 1,
            opacity: 0.5,
        },
    },

    // Layout breakpoints
    breakpoints: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536,
    },
};

// Component Styles
export const LuxeStyles = {
    // Typography presets
    typography: {
        displayLarge: {
            fontFamily: DesignTokens.fonts.display,
            fontSize: DesignTokens.fontSize.display,
            fontWeight: DesignTokens.fontWeights.bold,
            lineHeight: DesignTokens.lineHeight.tight,
            letterSpacing: DesignTokens.letterSpacing.tight,
            color: DesignTokens.colors.text,
        },
        displayMedium: {
            fontFamily: DesignTokens.fonts.display,
            fontSize: DesignTokens.fontSize['4xl'],
            fontWeight: DesignTokens.fontWeights.bold,
            lineHeight: DesignTokens.lineHeight.tight,
            letterSpacing: DesignTokens.letterSpacing.tight,
            color: DesignTokens.colors.text,
        },
        displaySmall: {
            fontFamily: DesignTokens.fonts.display,
            fontSize: DesignTokens.fontSize['3xl'],
            fontWeight: DesignTokens.fontWeights.semibold,
            lineHeight: DesignTokens.lineHeight.snug,
            color: DesignTokens.colors.text,
        },
        headingLarge: {
            fontFamily: DesignTokens.fonts.display,
            fontSize: DesignTokens.fontSize['2xl'],
            fontWeight: DesignTokens.fontWeights.semibold,
            lineHeight: DesignTokens.lineHeight.snug,
            color: DesignTokens.colors.text,
        },
        headingMedium: {
            fontFamily: DesignTokens.fonts.display,
            fontSize: DesignTokens.fontSize.xl,
            fontWeight: DesignTokens.fontWeights.semibold,
            lineHeight: DesignTokens.lineHeight.snug,
            color: DesignTokens.colors.text,
        },
        headingSmall: {
            fontFamily: DesignTokens.fonts.display,
            fontSize: DesignTokens.fontSize.lg,
            fontWeight: DesignTokens.fontWeights.medium,
            lineHeight: DesignTokens.lineHeight.snug,
            color: DesignTokens.colors.text,
        },
        bodyLarge: {
            fontFamily: DesignTokens.fonts.body,
            fontSize: DesignTokens.fontSize.md,
            fontWeight: DesignTokens.fontWeights.normal,
            lineHeight: DesignTokens.lineHeight.relaxed,
            color: DesignTokens.colors.text,
        },
        bodyMedium: {
            fontFamily: DesignTokens.fonts.body,
            fontSize: DesignTokens.fontSize.base,
            fontWeight: DesignTokens.fontWeights.normal,
            lineHeight: DesignTokens.lineHeight.relaxed,
            color: DesignTokens.colors.text,
        },
        bodySmall: {
            fontFamily: DesignTokens.fonts.body,
            fontSize: DesignTokens.fontSize.sm,
            fontWeight: DesignTokens.fontWeights.normal,
            lineHeight: DesignTokens.lineHeight.normal,
            color: DesignTokens.colors.textSecondary,
        },
        caption: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.xs,
            fontWeight: DesignTokens.fontWeights.medium,
            lineHeight: DesignTokens.lineHeight.normal,
            letterSpacing: DesignTokens.letterSpacing.wide,
            color: DesignTokens.colors.textMuted,
            textTransform: 'uppercase' as const,
        },
        label: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.sm,
            fontWeight: DesignTokens.fontWeights.semibold,
            lineHeight: DesignTokens.lineHeight.normal,
            letterSpacing: DesignTokens.letterSpacing.caps,
            color: DesignTokens.colors.textSecondary,
            textTransform: 'uppercase' as const,
        },
    },

    // Button styles
    button: {
        primary: {
            backgroundColor: DesignTokens.colors.accent,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: DesignTokens.radius.md,
            ...DesignTokens.shadows.soft,
        },
        primaryText: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.sm,
            fontWeight: DesignTokens.fontWeights.semibold,
            letterSpacing: DesignTokens.letterSpacing.wider,
            color: DesignTokens.colors.textOnAccent,
            textTransform: 'uppercase' as const,
        },
        secondary: {
            backgroundColor: DesignTokens.colors.surface,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: DesignTokens.radius.md,
            borderWidth: DesignTokens.borders.thin,
            borderColor: DesignTokens.colors.border,
            ...DesignTokens.shadows.subtle,
        },
        secondaryText: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.sm,
            fontWeight: DesignTokens.fontWeights.semibold,
            letterSpacing: DesignTokens.letterSpacing.wider,
            color: DesignTokens.colors.text,
            textTransform: 'uppercase' as const,
        },
        ghost: {
            backgroundColor: 'transparent',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: DesignTokens.radius.md,
        },
        ghostText: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.sm,
            fontWeight: DesignTokens.fontWeights.medium,
            letterSpacing: DesignTokens.letterSpacing.wide,
            color: DesignTokens.colors.accent,
        },
        link: {
            backgroundColor: 'transparent',
            paddingVertical: 4,
            paddingHorizontal: 0,
        },
        linkText: {
            fontFamily: DesignTokens.fonts.body,
            fontSize: DesignTokens.fontSize.base,
            fontWeight: DesignTokens.fontWeights.medium,
            color: DesignTokens.colors.accent,
            textDecorationLine: 'underline' as const,
        },
    },

    // Card styles
    card: {
        base: {
            backgroundColor: DesignTokens.colors.surface,
            borderRadius: DesignTokens.radius.lg,
            padding: DesignTokens.spacing.lg,
            ...DesignTokens.shadows.soft,
        },
        elevated: {
            backgroundColor: DesignTokens.colors.surfaceElevated,
            borderRadius: DesignTokens.radius.xl,
            padding: DesignTokens.spacing.xl,
            ...DesignTokens.shadows.elevated,
        },
        bordered: {
            backgroundColor: DesignTokens.colors.surface,
            borderRadius: DesignTokens.radius.lg,
            padding: DesignTokens.spacing.lg,
            borderWidth: DesignTokens.borders.thin,
            borderColor: DesignTokens.colors.border,
        },
        feature: {
            backgroundColor: DesignTokens.colors.backgroundDark,
            borderRadius: DesignTokens.radius['2xl'],
            padding: DesignTokens.spacing['2xl'],
            ...DesignTokens.shadows.dramatic,
        },
        featureText: {
            color: DesignTokens.colors.textOnDark,
        },
        accent: {
            backgroundColor: DesignTokens.colors.accent,
            borderRadius: DesignTokens.radius.lg,
            padding: DesignTokens.spacing.lg,
            ...DesignTokens.shadows.glow,
        },
    },

    // Input styles
    input: {
        base: {
            backgroundColor: DesignTokens.colors.surface,
            borderWidth: DesignTokens.borders.thin,
            borderColor: DesignTokens.colors.border,
            borderRadius: DesignTokens.radius.md,
            paddingVertical: 16,
            paddingHorizontal: 20,
            fontFamily: DesignTokens.fonts.body,
            fontSize: DesignTokens.fontSize.base,
            color: DesignTokens.colors.text,
        },
        focused: {
            borderColor: DesignTokens.colors.accent,
            ...DesignTokens.shadows.innerGlow,
        },
        error: {
            borderColor: DesignTokens.colors.error,
        },
        label: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.sm,
            fontWeight: DesignTokens.fontWeights.medium,
            color: DesignTokens.colors.textSecondary,
            marginBottom: 8,
        },
        hint: {
            fontFamily: DesignTokens.fonts.body,
            fontSize: DesignTokens.fontSize.sm,
            color: DesignTokens.colors.textMuted,
            marginTop: 8,
        },
    },

    // Navigation
    nav: {
        header: {
            backgroundColor: DesignTokens.colors.background,
            paddingVertical: DesignTokens.spacing.md,
            paddingHorizontal: DesignTokens.spacing.lg,
            borderBottomWidth: DesignTokens.borders.thin,
            borderBottomColor: DesignTokens.colors.border,
        },
        tab: {
            paddingVertical: DesignTokens.spacing.md,
            paddingHorizontal: DesignTokens.spacing.lg,
        },
        tabActive: {
            borderBottomWidth: 2,
            borderBottomColor: DesignTokens.colors.accent,
        },
        tabText: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.sm,
            fontWeight: DesignTokens.fontWeights.medium,
            color: DesignTokens.colors.textMuted,
        },
        tabTextActive: {
            color: DesignTokens.colors.text,
        },
    },

    // Modal styles
    modal: {
        overlay: {
            backgroundColor: DesignTokens.colors.overlay,
        },
        container: {
            backgroundColor: DesignTokens.colors.surface,
            borderRadius: DesignTokens.radius['2xl'],
            padding: DesignTokens.spacing['2xl'],
            ...DesignTokens.shadows.dramatic,
            maxWidth: 480,
        },
        header: {
            marginBottom: DesignTokens.spacing.lg,
        },
        title: {
            fontFamily: DesignTokens.fonts.display,
            fontSize: DesignTokens.fontSize.xl,
            fontWeight: DesignTokens.fontWeights.semibold,
            color: DesignTokens.colors.text,
        },
    },

    // Dividers
    divider: {
        thin: {
            height: 1,
            backgroundColor: DesignTokens.colors.divider,
        },
        decorative: {
            height: 2,
            backgroundColor: DesignTokens.colors.accent,
            width: 60,
            borderRadius: DesignTokens.radius.full,
        },
    },

    // Badge/Tag styles
    badge: {
        base: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: DesignTokens.radius.full,
        },
        default: {
            backgroundColor: DesignTokens.colors.backgroundAlt,
        },
        accent: {
            backgroundColor: DesignTokens.colors.accentLight,
        },
        success: {
            backgroundColor: 'rgba(74, 124, 89, 0.15)',
        },
        text: {
            fontFamily: DesignTokens.fonts.ui,
            fontSize: DesignTokens.fontSize.xs,
            fontWeight: DesignTokens.fontWeights.semibold,
            letterSpacing: DesignTokens.letterSpacing.wide,
            textTransform: 'uppercase' as const,
        },
    },

    // Avatar styles
    avatar: {
        small: {
            width: 32,
            height: 32,
            borderRadius: DesignTokens.radius.full,
        },
        medium: {
            width: 48,
            height: 48,
            borderRadius: DesignTokens.radius.full,
        },
        large: {
            width: 72,
            height: 72,
            borderRadius: DesignTokens.radius.full,
        },
        border: {
            borderWidth: 2,
            borderColor: DesignTokens.colors.accent,
        },
    },

    // Special decorative elements
    decorative: {
        goldLine: {
            height: 1,
            backgroundColor: DesignTokens.colors.accent,
        },
        ornament: {
            color: DesignTokens.colors.accent,
            fontSize: 24,
        },
        quote: {
            borderLeftWidth: 3,
            borderLeftColor: DesignTokens.colors.accent,
            paddingLeft: DesignTokens.spacing.lg,
            fontFamily: DesignTokens.fonts.displayItalic,
            fontStyle: 'italic' as const,
        },
    },
};

// Backward compatibility - map to old BrutalistStyles naming
export const BrutalistStyles = LuxeStyles;

export default { DesignTokens, LuxeStyles, BrutalistStyles };
