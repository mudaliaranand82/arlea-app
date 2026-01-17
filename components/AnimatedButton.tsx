import React, { PropsWithChildren, useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { DesignTokens } from "../constants/DesignSystem";

type AnimatedButtonProps = PropsWithChildren<{
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'link';
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}>;

// Elegant shimmer effect
function GoldShimmer({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0.6);

    React.useEffect(() => {
        scale.value = withSpring(2, {
            damping: 15,
            stiffness: 150,
        });
        opacity.value = withTiming(0, {
            duration: 500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        });

        const timer = setTimeout(onComplete, 500);
        return () => clearTimeout(timer);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.shimmer,
                animStyle,
                { left: x - 30, top: y - 30 }
            ]}
        />
    );
}

export function AnimatedButton({
    children,
    style,
    onPress,
    variant = 'primary',
    disabled = false,
    size = 'md',
}: AnimatedButtonProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const [shimmers, setShimmers] = useState<{ id: number; x: number; y: number }[]>([]);
    let shimmerId = 0;

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = (event: any) => {
        scale.value = withSpring(DesignTokens.buttonStates.pressed.scale, {
            damping: 15,
            stiffness: 400,
        });

        if (variant === 'primary') {
            const { locationX, locationY } = event.nativeEvent;
            const newShimmer = { id: ++shimmerId, x: locationX, y: locationY };
            setShimmers(prev => [...prev, newShimmer]);
        }
    };

    const handlePressOut = () => {
        scale.value = withSpring(DesignTokens.buttonStates.idle.scale, {
            damping: 15,
            stiffness: 400,
        });
    };

    const handleHoverIn = () => {
        scale.value = withSpring(DesignTokens.buttonStates.hover.scale, {
            damping: 20,
            stiffness: 300,
        });
    };

    const handleHoverOut = () => {
        scale.value = withSpring(DesignTokens.buttonStates.idle.scale, {
            damping: 20,
            stiffness: 300,
        });
    };

    const removeShimmer = (id: number) => {
        setShimmers(prev => prev.filter(s => s.id !== id));
    };

    const getVariantStyle = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: DesignTokens.colors.accent,
                    borderColor: 'transparent',
                    ...DesignTokens.shadows.soft,
                };
            case 'secondary':
                return {
                    backgroundColor: DesignTokens.colors.surface,
                    borderColor: DesignTokens.colors.border,
                    borderWidth: 1,
                    ...DesignTokens.shadows.subtle,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderColor: DesignTokens.colors.primary,
                    borderWidth: 1.5,
                };
            case 'link':
                return {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                };
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return {
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                };
            case 'md':
                return {
                    paddingVertical: 14,
                    paddingHorizontal: 28,
                };
            case 'lg':
                return {
                    paddingVertical: 18,
                    paddingHorizontal: 36,
                };
        }
    };

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            onPressIn={disabled ? undefined : handlePressIn}
            onPressOut={disabled ? undefined : handlePressOut}
            onHoverIn={disabled ? undefined : handleHoverIn}
            onHoverOut={disabled ? undefined : handleHoverOut}
            style={[styles.pressable, style, disabled && styles.disabled]}
        >
            <Animated.View style={[
                styles.btn,
                animStyle,
                getVariantStyle(),
                getSizeStyle(),
                disabled && { opacity: 0.5 }
            ]}>
                {/* Gold shimmer effects */}
                {shimmers.map(shimmer => (
                    <GoldShimmer
                        key={shimmer.id}
                        x={shimmer.x}
                        y={shimmer.y}
                        onComplete={() => removeShimmer(shimmer.id)}
                    />
                ))}
                <View style={styles.content}>{children}</View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {},
    disabled: {
        pointerEvents: 'none',
    },
    btn: {
        borderRadius: DesignTokens.radius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    shimmer: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: DesignTokens.colors.shimmer,
        zIndex: 0,
    },
});
