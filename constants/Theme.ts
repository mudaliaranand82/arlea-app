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
        textAlign: 'center',
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
        textAlign: 'center',
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
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: Colors.classic.primary,
    },
    buttonText: {
        fontFamily: 'Outfit_600SemiBold',
        color: Colors.classic.textLight,
        fontSize: 16,
        letterSpacing: 0.5,
    },
    input: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.classic.surface,
        marginBottom: 16,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        borderWidth: 1,
        borderColor: Colors.classic.border,
        color: Colors.classic.text,
    },
    card: {
        backgroundColor: Colors.classic.surface,
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.classic.border,
    },
    // Utilities
    shadowSm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    shadowMd: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    shadowLg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    }
});
