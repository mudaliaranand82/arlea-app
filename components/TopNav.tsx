import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { DesignTokens } from '../constants/DesignSystem';
import { AnimatedButton } from './AnimatedButton';

type TopNavProps = {
    showLogout?: boolean;
    onLogout?: () => void;
    rightContent?: React.ReactNode;
};

export function TopNav({ showLogout = true, onLogout, rightContent }: TopNavProps) {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    return (
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>ARLEA</Text>
            </View>

            {/* Right Side */}
            <View style={styles.rightContainer}>
                {rightContent}
                {showLogout && onLogout && (
                    <AnimatedButton variant="outline" onPress={onLogout}>
                        <Text style={styles.logoutText}>LOG OUT</Text>
                    </AnimatedButton>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: DesignTokens.borders.regular,
        borderBottomColor: DesignTokens.colors.border,
        backgroundColor: DesignTokens.colors.background,
    },
    containerDesktop: {
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: DesignTokens.colors.text,
        letterSpacing: 3,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
});
