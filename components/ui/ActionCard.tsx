import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ActionCardProps {
    backgroundColor: string;
    textColor: string;
    onPress: () => void;
    title: string;
    subtitle: string;
    style?: StyleProp<ViewStyle>;
}

export function ActionCard({ backgroundColor, textColor, onPress, title, subtitle, style }: ActionCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[
                styles.container,
                { backgroundColor },
                style
            ]}
        >
            <View style={styles.content}>
                <Text style={[styles.title, { color: textColor }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: textColor, opacity: 0.9 }]}>{subtitle}</Text>
            </View>

            {/* Decorative Icon or Arrow could go here */}
            <View style={[styles.circle, { backgroundColor: textColor }]} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        marginVertical: 10,
        minHeight: 140,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)', // Subtle border
        // Shadow for classic elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    content: {
        padding: 24,
        paddingRight: 60,
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        lineHeight: 22,
    },
    circle: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        opacity: 0.1, // Very subtle accent
    }
});
