import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.classic.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Typography
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 32,
        color: Colors.classic.text,
        marginBottom: 8,
    },
    heading: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 24,
        color: Colors.classic.text,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 18,
        color: Colors.classic.textSecondary,
        marginBottom: 30,
        lineHeight: 26,
    },
    body: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: Colors.classic.text,
        lineHeight: 24,
    },

    // Components
    button: {
        backgroundColor: Colors.classic.primary,
        borderRadius: 30, // Pill shape
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: Colors.classic.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontFamily: 'Outfit_700Bold',
        color: Colors.classic.textLight,
        fontSize: 18,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.classic.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: Colors.classic.text,
        borderWidth: 1,
        borderColor: Colors.classic.border,
        marginBottom: 16,
    },
    card: {
        backgroundColor: Colors.classic.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.classic.border,
        // Soft shadow for depth
        shadowColor: Colors.classic.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    // Utilities
    shadowSm: {
        shadowColor: Colors.classic.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    shadowMd: {
        shadowColor: Colors.classic.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    shadowLg: {
        shadowColor: Colors.classic.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    }
});
