/**
 * Responsive Utilities for Arlea App
 * 
 * Provides scaling functions and breakpoints for mobile-first responsive design.
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design width (iPhone 14 Pro / standard mobile design)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Breakpoints for responsive design
 */
export const Breakpoints = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
} as const;

/**
 * Check if current screen is mobile-sized
 */
export const isMobile = () => SCREEN_WIDTH < Breakpoints.tablet;
export const isTablet = () => SCREEN_WIDTH >= Breakpoints.tablet && SCREEN_WIDTH < Breakpoints.desktop;
export const isDesktop = () => SCREEN_WIDTH >= Breakpoints.desktop;

/**
 * Scale a value based on screen width
 * Uses the screen width ratio against the base design width
 */
export const scaleWidth = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale a value based on screen height
 */
export const scaleHeight = (size: number): number => {
    const scale = SCREEN_HEIGHT / BASE_HEIGHT;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale font size with a moderate factor
 * Font scaling is capped to prevent overly large/small text
 */
export const scaleFontSize = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    // Use a moderate scaling factor (0.5 means we scale at half the rate)
    const moderateScale = 0.5;
    const newSize = size + (scale - 1) * moderateScale * size;

    // Cap the font size to reasonable bounds
    const minSize = size * 0.7;  // Never go below 70% of original
    const maxSize = size * 1.3;  // Never go above 130% of original

    return Math.round(PixelRatio.roundToNearestPixel(
        Math.max(minSize, Math.min(maxSize, newSize))
    ));
};

/**
 * Get responsive font size based on device type
 * Returns smaller sizes for mobile, larger for tablet/desktop
 */
export const responsiveFontSize = (mobile: number, tablet?: number, desktop?: number): number => {
    if (isDesktop()) return desktop ?? tablet ?? mobile * 1.2;
    if (isTablet()) return tablet ?? mobile * 1.1;
    return mobile;
};

/**
 * Get responsive value based on screen width
 */
export const responsiveValue = <T>(mobile: T, tablet?: T, desktop?: T): T => {
    if (isDesktop()) return desktop ?? tablet ?? mobile;
    if (isTablet()) return tablet ?? mobile;
    return mobile;
};

/**
 * Calculate dynamic width as percentage of screen
 */
export const widthPercent = (percent: number): number => {
    return (SCREEN_WIDTH * percent) / 100;
};

/**
 * Calculate dynamic height as percentage of screen
 */
export const heightPercent = (percent: number): number => {
    return (SCREEN_HEIGHT * percent) / 100;
};

/**
 * Get current screen dimensions
 * Useful for components that need to react to orientation changes
 */
export const getScreenDimensions = () => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
};

/**
 * Check if running on web
 */
export const isWeb = Platform.OS === 'web';

/**
 * Maximum content width for larger screens
 * Prevents content from stretching too wide on desktop
 */
export const MAX_CONTENT_WIDTH = 600;

/**
 * Get container width with max limit for desktop
 */
export const getContainerWidth = (): number | string => {
    if (isWeb && SCREEN_WIDTH > MAX_CONTENT_WIDTH) {
        return MAX_CONTENT_WIDTH;
    }
    return '100%';
};
