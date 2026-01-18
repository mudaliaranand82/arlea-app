import { LinearGradient } from "expo-linear-gradient";
import React, { PropsWithChildren, useCallback, useState } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { DesignTokens } from "../constants/DesignSystem";

type AnimatedCardProps = PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    variant?: 'light' | 'dark' | 'accent';
    disabled?: boolean;
}>;

// Ripple effect component
function ClickRipple({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(1);

    React.useEffect(() => {
        scale.value = withTiming(1.5, {
            duration: DesignTokens.animation.ripple,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        opacity.value = withTiming(0, {
            duration: DesignTokens.animation.ripple,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        }, () => {
            // Cleanup after animation
        });

        const timer = setTimeout(onComplete, DesignTokens.animation.ripple);
        return () => clearTimeout(timer);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.ripple,
                animStyle,
                { left: x - 25, top: y - 25 }
            ]}
        />
    );
}

export function AnimatedCard({
    children,
    style,
    onPress,
    variant = 'light',
    disabled = false
}: AnimatedCardProps) {
    const t = useSharedValue(0);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
    let rippleId = 0;

    const animateTo = useCallback(
        (to: number) => {
            if (disabled) return;
            t.value = withTiming(to, {
                duration: DesignTokens.animation.fast,
                easing: Easing.out(Easing.ease),
            });
        },
        [t, disabled]
    );

    // Button press animation - shadow reduces as card "presses in"
    const cardAnimStyle = useAnimatedStyle(() => {
        const { idle, active } = DesignTokens.buttonPress;
        const translateX = interpolate(t.value, [0, 1], [idle.translate.x, active.translate.x]);
        const translateY = interpolate(t.value, [0, 1], [idle.translate.y, active.translate.y]);

        return {
            transform: [{ translateX }, { translateY }],
        };
    });

    const shadowAnimStyle = useAnimatedStyle(() => {
        const { idle, active } = DesignTokens.buttonPress;
        const shadowX = interpolate(t.value, [0, 1], [idle.shadowOffset.width, active.shadowOffset.width]);
        const shadowY = interpolate(t.value, [0, 1], [idle.shadowOffset.height, active.shadowOffset.height]);

        return {
            shadowOffset: { width: shadowX, height: shadowY },
        };
    });

    const handlePressIn = (event: any) => {
        animateTo(1);

        // Add ripple at press location
        const { locationX, locationY } = event.nativeEvent;
        const newRipple = { id: ++rippleId, x: locationX, y: locationY };
        setRipples(prev => [...prev, newRipple]);
    };

    const removeRipple = (id: number) => {
        setRipples(prev => prev.filter(r => r.id !== id));
    };

    // Color schemes
    const getColors = () => {
        switch (variant) {
            case 'dark':
                return {
                    bg: DesignTokens.colors.backgroundDark,
                    gradientColors: [
                        'rgba(255,255,255,0.08)',
                        'rgba(255,255,255,0.04)',
                        'rgba(255,255,255,0.06)',
                    ] as const,
                };
            case 'accent':
                return {
                    bg: DesignTokens.colors.primary,
                    gradientColors: [
                        'rgba(255,255,255,0.12)',
                        'rgba(255,255,255,0.06)',
                        'rgba(255,255,255,0.10)',
                    ] as const,
                };
            default:
                return {
                    bg: DesignTokens.colors.background,
                    gradientColors: [
                        'rgba(0,0,0,0.01)',
                        'rgba(0,0,0,0.00)',
                        'rgba(0,0,0,0.01)',
                    ] as const,
                };
        }
    };

    const colors = getColors();

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            onPressIn={handlePressIn}
            onPressOut={() => animateTo(0)}
            onHoverIn={() => animateTo(0.5)} // Halfway press on hover
            onHoverOut={() => animateTo(0)}
            style={[styles.pressable, style, disabled && styles.disabled]}
        >
            <Animated.View style={[
                styles.card,
                cardAnimStyle,
                shadowAnimStyle,
                { backgroundColor: colors.bg }
            ]}>
                {/* Gradient overlay */}
                <View pointerEvents="none" style={styles.gradientContainer}>
                    <LinearGradient
                        colors={colors.gradientColors}
                        start={{ x: 0.2, y: 0.2 }}
                        end={{ x: 0.9, y: 0.9 }}
                        style={styles.gradient}
                    />
                </View>

                {/* Ripple effects */}
                {ripples.map(ripple => (
                    <ClickRipple
                        key={ripple.id}
                        x={ripple.x}
                        y={ripple.y}
                        onComplete={() => removeRipple(ripple.id)}
                    />
                ))}

                {/* Content */}
                <View style={styles.content}>{children}</View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        width: "100%",
    },
    disabled: {
        opacity: 0.6,
    },
    card: {
        borderRadius: 0, // Sharp corners - brutalist
        overflow: "hidden",
        borderWidth: DesignTokens.borders.thick,
        borderColor: DesignTokens.colors.border,

        // Hard offset shadow
        shadowColor: DesignTokens.colors.border,
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
    },
    gradientContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    gradient: {
        flex: 1,
    },
    content: {
        padding: DesignTokens.spacing.lg,
    },
    ripple: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: DesignTokens.colors.accent,
        zIndex: 100,
    },
});
