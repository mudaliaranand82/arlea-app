import React, { PropsWithChildren, useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { DesignTokens } from "../constants/DesignSystem";

type AnimatedButtonProps = PropsWithChildren<{
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
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
                { left: x - 20, top: y - 20 }
            ]}
        />
    );
}

export function AnimatedButton({
    children,
    style,
    onPress,
    variant = 'primary'
}: AnimatedButtonProps) {
    const t = useSharedValue(0);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
    let rippleId = 0;

    const animStyle = useAnimatedStyle(() => {
        const { idle, active } = DesignTokens.buttonPress;
        const translateX = interpolate(t.value, [0, 1], [idle.translate.x, active.translate.x]);
        const translateY = interpolate(t.value, [0, 1], [idle.translate.y, active.translate.y]);
        const shadowX = interpolate(t.value, [0, 1], [idle.shadowOffset.width, active.shadowOffset.width]);
        const shadowY = interpolate(t.value, [0, 1], [idle.shadowOffset.height, active.shadowOffset.height]);

        return {
            transform: [{ translateX }, { translateY }],
            shadowOffset: { width: shadowX, height: shadowY },
        };
    });

    const animateTo = (to: number) => {
        t.value = withTiming(to, {
            duration: DesignTokens.animation.fast,
            easing: Easing.out(Easing.ease),
        });
    };

    const handlePressIn = (event: any) => {
        animateTo(1);

        const { locationX, locationY } = event.nativeEvent;
        const newRipple = { id: ++rippleId, x: locationX, y: locationY };
        setRipples(prev => [...prev, newRipple]);
    };

    const removeRipple = (id: number) => {
        setRipples(prev => prev.filter(r => r.id !== id));
    };

    const getVariantStyle = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: DesignTokens.colors.primary,
                    borderColor: DesignTokens.colors.border,
                };
            case 'secondary':
                return {
                    backgroundColor: DesignTokens.colors.background,
                    borderColor: DesignTokens.colors.border,
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderColor: DesignTokens.colors.border,
                };
        }
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={() => animateTo(0)}
            onHoverIn={() => animateTo(0.5)}
            onHoverOut={() => animateTo(0)}
            style={[styles.pressable, style]}
        >
            <Animated.View style={[styles.btn, animStyle, getVariantStyle()]}>
                {/* Ripple effects */}
                {ripples.map(ripple => (
                    <ClickRipple
                        key={ripple.id}
                        x={ripple.x}
                        y={ripple.y}
                        onComplete={() => removeRipple(ripple.id)}
                    />
                ))}
                <View style={styles.content}>{children}</View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {},
    btn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 0, // Sharp corners - brutalist
        borderWidth: DesignTokens.borders.regular,
        overflow: 'hidden',
        position: 'relative',

        // Hard offset shadow
        shadowColor: DesignTokens.colors.border,
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ripple: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DesignTokens.colors.accent,
        zIndex: 0,
    },
});
