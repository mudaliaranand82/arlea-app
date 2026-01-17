import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens } from '../../constants/DesignSystem';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../firebaseConfig';

// Interactive Role Card Component
function RoleCard({
    title,
    subtitle,
    description,
    icon,
    variant,
    onPress,
    disabled,
}: {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    variant: 'dark' | 'light';
    onPress: () => void;
    disabled: boolean;
}) {
    const scale = useSharedValue(1);
    const isDark = variant === 'dark';

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.cardPressable}
        >
            <Animated.View
                style={[
                    styles.card,
                    isDark ? styles.cardDark : styles.cardLight,
                    animatedStyle,
                ]}
            >
                {/* Background Gradient for Dark Card */}
                {isDark && (
                    <LinearGradient
                        colors={[DesignTokens.colors.primary, DesignTokens.colors.primaryLight]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}

                {/* Decorative ornament */}
                <Text style={[styles.cardOrnament, isDark && styles.cardOrnamentDark]}>
                    {isDark ? '"' : '*'}
                </Text>

                {/* Icon */}
                <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                    <Text style={styles.iconText}>{icon}</Text>
                </View>

                {/* Content */}
                <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
                    {subtitle}
                </Text>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                    {title}
                </Text>

                <View style={styles.goldLine} />

                <Text style={[styles.cardDescription, isDark && styles.cardDescriptionDark]}>
                    {description}
                </Text>

                {/* CTA */}
                <View style={[styles.cardCta, isDark && styles.cardCtaDark]}>
                    <Text style={[styles.cardCtaText, isDark && styles.cardCtaTextDark]}>
                        Choose This Path
                    </Text>
                    <Text style={[styles.cardCtaArrow, isDark && styles.cardCtaArrowDark]}>
                        {'>'}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}

export default function RoleSelectionScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const handleRoleSelect = async (role: 'author' | 'reader') => {
        if (!user) {
            Alert.alert("Error", "No authenticated user found.");
            return;
        }

        setLoading(true);

        try {
            const userRef = doc(db, "users", user.uid);
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore update timed out")), 10000)
            );

            await Promise.race([
                updateDoc(userRef, { role: role }),
                timeout
            ]);

            if (role === 'author') {
                router.replace('/onboarding/author/welcome');
            } else {
                router.replace('/onboarding/reader/welcome');
            }
        } catch (error: any) {
            console.error("Error updating role:", error);
            Alert.alert("Error", "Failed to save your selection. " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/');
        } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(500)}
                style={styles.header}
            >
                <View style={styles.logoContainer}>
                    <Text style={styles.logoAccent}>~</Text>
                    <Text style={styles.logo}>Arlea</Text>
                    <Text style={styles.logoAccent}>~</Text>
                </View>

                <Pressable onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </Pressable>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <Animated.View
                    entering={FadeInUp.duration(600).delay(200)}
                    style={[styles.hero, isDesktop && styles.heroDesktop]}
                >
                    <Text style={styles.heroOrnament}>&</Text>
                    <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
                        Choose Your Path
                    </Text>
                    <View style={styles.heroGoldLine} />
                    <Text style={styles.subheadline}>
                        How will you experience Arlea? Select your primary role to begin.
                    </Text>
                </Animated.View>

                {/* Cards Container */}
                <Animated.View
                    entering={FadeIn.duration(700).delay(400)}
                    style={[styles.cardsContainer, isDesktop && styles.cardsContainerDesktop]}
                >
                    {/* Author Card - Dark */}
                    <RoleCard
                        title="Author"
                        subtitle="For Creators"
                        description="Breathe life into your characters with AI. Define their voice, memories, and boundaries. Watch readers fall in love with your creations."
                        icon="~"
                        variant="dark"
                        onPress={() => handleRoleSelect('author')}
                        disabled={loading}
                    />

                    {/* Reader Card - Light */}
                    <RoleCard
                        title="Reader"
                        subtitle="For Explorers"
                        description="Discover enchanting stories and converse with unforgettable characters. Step beyond the page into living narratives."
                        icon="*"
                        variant="light"
                        onPress={() => handleRoleSelect('reader')}
                        disabled={loading}
                    />
                </Animated.View>

                {/* Note */}
                <Animated.Text
                    entering={FadeIn.duration(500).delay(600)}
                    style={styles.noteText}
                >
                    You can switch between roles at any time from your profile settings.
                </Animated.Text>
            </ScrollView>

            {/* Loading Overlay */}
            {loading && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    style={styles.loadingOverlay}
                >
                    <View style={styles.loadingBox}>
                        <Text style={styles.loadingOrnament}>~</Text>
                        <Text style={styles.loadingText}>Preparing your experience...</Text>
                    </View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logo: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 24,
        color: DesignTokens.colors.text,
    },
    logoAccent: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 20,
        color: DesignTokens.colors.accent,
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 14,
        color: DesignTokens.colors.textSecondary,
    },

    // Scroll
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 48,
    },

    // Hero
    hero: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    heroDesktop: {
        paddingTop: 48,
        paddingBottom: 56,
    },
    heroOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 100,
        color: DesignTokens.colors.accent,
        opacity: 0.12,
        position: 'absolute',
        top: -20,
    },
    headline: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 38,
        color: DesignTokens.colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    headlineDesktop: {
        fontSize: 52,
    },
    heroGoldLine: {
        width: 60,
        height: 2,
        backgroundColor: DesignTokens.colors.accent,
        marginBottom: 16,
        borderRadius: 1,
    },
    subheadline: {
        fontFamily: 'Lora',
        fontSize: 16,
        color: DesignTokens.colors.textSecondary,
        textAlign: 'center',
        maxWidth: 360,
        lineHeight: 26,
    },

    // Cards
    cardsContainer: {
        paddingHorizontal: 24,
        gap: 24,
    },
    cardsContainerDesktop: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 48,
        gap: 32,
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    cardPressable: {
        flex: 1,
    },
    card: {
        borderRadius: DesignTokens.radius['2xl'],
        padding: 32,
        overflow: 'hidden',
        minHeight: 320,
    },
    cardDark: {
        backgroundColor: DesignTokens.colors.primary,
        ...DesignTokens.shadows.dramatic,
    },
    cardLight: {
        backgroundColor: DesignTokens.colors.surface,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        ...DesignTokens.shadows.elevated,
    },
    cardOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 120,
        color: DesignTokens.colors.accent,
        opacity: 0.1,
        position: 'absolute',
        right: -20,
        top: -30,
    },
    cardOrnamentDark: {
        color: DesignTokens.colors.textOnDark,
        opacity: 0.08,
    },

    // Icon
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: DesignTokens.colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainerDark: {
        backgroundColor: 'rgba(201, 169, 98, 0.2)',
    },
    iconText: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 28,
        color: DesignTokens.colors.accent,
    },

    // Card Content
    cardSubtitle: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 12,
        color: DesignTokens.colors.accent,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    cardSubtitleDark: {
        color: DesignTokens.colors.accentLight,
    },
    cardTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 28,
        color: DesignTokens.colors.text,
        marginBottom: 12,
    },
    cardTitleDark: {
        color: DesignTokens.colors.textOnDark,
    },
    goldLine: {
        width: 40,
        height: 2,
        backgroundColor: DesignTokens.colors.accent,
        marginBottom: 16,
        borderRadius: 1,
    },
    cardDescription: {
        fontFamily: 'Lora',
        fontSize: 15,
        color: DesignTokens.colors.textSecondary,
        lineHeight: 24,
        marginBottom: 24,
    },
    cardDescriptionDark: {
        color: 'rgba(250, 247, 242, 0.8)',
    },

    // Card CTA
    cardCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        backgroundColor: DesignTokens.colors.accent,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: DesignTokens.radius.md,
    },
    cardCtaDark: {
        backgroundColor: DesignTokens.colors.surface,
    },
    cardCtaText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 13,
        color: DesignTokens.colors.textOnAccent,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    cardCtaTextDark: {
        color: DesignTokens.colors.text,
    },
    cardCtaArrow: {
        fontFamily: 'Lora',
        fontSize: 16,
        color: DesignTokens.colors.textOnAccent,
    },
    cardCtaArrowDark: {
        color: DesignTokens.colors.text,
    },

    // Note
    noteText: {
        fontFamily: 'Lora-Italic',
        fontSize: 13,
        color: DesignTokens.colors.textMuted,
        textAlign: 'center',
        marginTop: 32,
        paddingHorizontal: 24,
    },

    // Loading
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: DesignTokens.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        backgroundColor: DesignTokens.colors.surface,
        paddingHorizontal: 40,
        paddingVertical: 32,
        borderRadius: DesignTokens.radius.xl,
        alignItems: 'center',
        ...DesignTokens.shadows.dramatic,
    },
    loadingOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 32,
        color: DesignTokens.colors.accent,
        marginBottom: 12,
    },
    loadingText: {
        fontFamily: 'Lora',
        fontSize: 16,
        color: DesignTokens.colors.text,
    },
});
