import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { GlobalStyles } from '../../constants/Theme';

interface GradientCardProps {
    colors: [string, string, ...string[]];
    onPress: () => void;
    title: string;
    subtitle: string;
    style?: StyleProp<ViewStyle>;
}

export function GradientCard({ colors, onPress, title, subtitle, style }: GradientCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.container, GlobalStyles.shadowMd, style]}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        marginVertical: 10,
    },
    gradient: {
        padding: 24,
        alignItems: 'flex-start',
        justifyContent: 'center',
        minHeight: 120,
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    }
});
