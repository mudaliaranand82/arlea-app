import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { AnimatedButton } from '../components/AnimatedButton';
import { DesignTokens } from '../constants/DesignSystem';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebaseConfig';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Where Stories\nCome Alive',
        subtitle: 'Experience literature reimagined. Engage with characters who remember, respond, and evolve with every conversation.',
        ornament: '"',
    },
    {
        id: '2',
        title: 'Create Your\nUniverse',
        subtitle: 'Authors craft rich worlds with AI-powered characters. Give your creations voice, memory, and authentic personality.',
        ornament: '*',
    },
    {
        id: '3',
        title: 'Converse with\nCharacters',
        subtitle: 'Step beyond the page. Your favorite protagonists await, ready to share secrets only whispered in the margins.',
        ornament: '&',
    },
];

// Decorative floating element
function FloatingOrnament({ delay = 0 }: { delay?: number }) {
    const float = useSharedValue(0);

    useEffect(() => {
        float.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            )
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(float.value, [0, 1], [0, -12]) }],
        opacity: interpolate(float.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
    }));

    return (
        <Animated.View style={[styles.floatingOrnament, animStyle]}>
            <Text style={styles.floatingOrnamentText}>~</Text>
        </Animated.View>
    );
}

// Animated pagination dot
function PaginationDot({ active, index }: { active: boolean; index: number }) {
    const width = useSharedValue(active ? 32 : 8);
    const opacity = useSharedValue(active ? 1 : 0.4);

    useEffect(() => {
        width.value = withTiming(active ? 32 : 8, { duration: 300 });
        opacity.value = withTiming(active ? 1 : 0.4, { duration: 300 });
    }, [active]);

    const animStyle = useAnimatedStyle(() => ({
        width: width.value,
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.paginationDot, animStyle]} />
    );
}

export default function WelcomeScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const { width, height } = useWindowDimensions();
    const isDesktop = width > 768;

    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            checkUserRole(user.uid);
        }
    }, [user, loading]);

    const checkUserRole = async (uid: string) => {
        try {
            const { getDoc, doc, collection, query, where, getDocs, limit } = await import('firebase/firestore');
            const { db } = await import('../firebaseConfig');

            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.role === 'author') {
                    const booksQ = query(collection(db, "books"), where("authorId", "==", uid), limit(1));
                    const booksSnap = await getDocs(booksQ);
                    if (!booksSnap.empty) {
                        router.replace('/dashboard/author');
                    } else {
                        router.replace('/onboarding/author/welcome');
                    }
                }
                else if (data.role === 'reader') router.replace('/dashboard/reader');
                else router.replace('/role-selection');
            } else {
                router.replace('/role-selection');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const onScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleDevReset = async () => {
        try {
            await signOut(auth);
            router.replace('/');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Warm parchment background with subtle gradient */}
            <LinearGradient
                colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt, DesignTokens.colors.background]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative floating elements */}
            <View style={styles.floatingContainer}>
                <FloatingOrnament delay={0} />
                <FloatingOrnament delay={1000} />
                <FloatingOrnament delay={2000} />
            </View>

            {/* Navigation Header */}
            <Animated.View
                entering={FadeInDown.duration(600).delay(200)}
                style={[styles.nav, isDesktop && styles.navDesktop]}
            >
                <View style={styles.logoContainer}>
                    <Text style={styles.logoAccent}>~</Text>
                    <Text style={styles.logo}>Arlea</Text>
                    <Text style={styles.logoAccent}>~</Text>
                </View>

                <Pressable
                    onPress={() => router.push('/auth/sign-in')}
                    style={styles.navLink}
                >
                    <Text style={styles.navLinkText}>Sign In</Text>
                </Pressable>
            </Animated.View>

            {/* Hero Carousel */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => (
                    <View style={[styles.slide, { width }]}>
                        {/* Large decorative ornament */}
                        <Animated.Text
                            entering={FadeIn.duration(800).delay(400)}
                            style={styles.ornament}
                        >
                            {item.ornament}
                        </Animated.Text>

                        {/* Title */}
                        <Animated.Text
                            entering={FadeInUp.duration(700).delay(300)}
                            style={[styles.title, isDesktop && styles.titleDesktop]}
                        >
                            {item.title}
                        </Animated.Text>

                        {/* Decorative gold line */}
                        <Animated.View
                            entering={FadeIn.duration(600).delay(500)}
                            style={styles.goldLine}
                        />

                        {/* Subtitle */}
                        <Animated.Text
                            entering={FadeInUp.duration(700).delay(500)}
                            style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}
                        >
                            {item.subtitle}
                        </Animated.Text>
                    </View>
                )}
            />

            {/* Footer */}
            <Animated.View
                entering={FadeInUp.duration(600).delay(600)}
                style={[styles.footer, isDesktop && styles.footerDesktop]}
            >
                {/* Elegant pagination */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <PaginationDot
                            key={index}
                            active={index === currentIndex}
                            index={index}
                        />
                    ))}
                </View>

                {/* CTA Buttons */}
                <View style={[styles.buttonContainer, isDesktop && styles.buttonContainerDesktop]}>
                    <AnimatedButton
                        variant="primary"
                        onPress={() => router.push('/auth/sign-up')}
                        size="lg"
                        style={styles.primaryButton}
                    >
                        <Text style={styles.primaryButtonText}>Begin Your Journey</Text>
                    </AnimatedButton>

                    <AnimatedButton
                        variant="secondary"
                        onPress={() => router.push('/auth/sign-in')}
                        size="lg"
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryButtonText}>Welcome Back</Text>
                    </AnimatedButton>
                </View>

                {/* Tagline */}
                <Text style={styles.tagline}>
                    Where every page turns into a conversation
                </Text>

                {/* Dev Reset - Very subtle */}
                <Pressable onPress={handleDevReset} style={styles.devButton}>
                    <Text style={styles.devButtonText}>Reset Session</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },

    // Floating decorations
    floatingContainer: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
    },
    floatingOrnament: {
        position: 'absolute',
        right: '15%',
        top: '20%',
    },
    floatingOrnamentText: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 120,
        color: DesignTokens.colors.accentLight,
    },

    // Navigation
    nav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingTop: 48,
    },
    navDesktop: {
        paddingHorizontal: 64,
        paddingVertical: 28,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logo: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 28,
        color: DesignTokens.colors.text,
        letterSpacing: 1,
    },
    logoAccent: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 24,
        color: DesignTokens.colors.accent,
    },
    navLink: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    navLinkText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 14,
        color: DesignTokens.colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Slides
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    ornament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 160,
        color: DesignTokens.colors.accent,
        opacity: 0.15,
        position: 'absolute',
        top: -40,
    },
    title: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 42,
        color: DesignTokens.colors.text,
        textAlign: 'center',
        lineHeight: 52,
        letterSpacing: -0.5,
    },
    titleDesktop: {
        fontSize: 64,
        lineHeight: 76,
    },
    goldLine: {
        width: 60,
        height: 2,
        backgroundColor: DesignTokens.colors.accent,
        marginVertical: 24,
        borderRadius: 1,
    },
    subtitle: {
        fontFamily: 'Lora',
        fontSize: 17,
        color: DesignTokens.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 340,
    },
    subtitleDesktop: {
        fontSize: 20,
        lineHeight: 34,
        maxWidth: 480,
    },

    // Footer
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    footerDesktop: {
        paddingBottom: 64,
    },

    // Pagination
    pagination: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
    },
    paginationDot: {
        height: 4,
        backgroundColor: DesignTokens.colors.accent,
        borderRadius: 2,
    },

    // Buttons
    buttonContainer: {
        width: '100%',
        gap: 14,
        maxWidth: 360,
    },
    buttonContainerDesktop: {
        flexDirection: 'row',
        maxWidth: 500,
        gap: 20,
    },
    primaryButton: {
        flex: 1,
    },
    primaryButtonText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 14,
        color: DesignTokens.colors.textOnAccent,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    secondaryButton: {
        flex: 1,
    },
    secondaryButtonText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // Tagline
    tagline: {
        fontFamily: 'Lora-Italic',
        fontSize: 14,
        color: DesignTokens.colors.textMuted,
        marginTop: 28,
        textAlign: 'center',
    },

    // Dev
    devButton: {
        marginTop: 20,
        padding: 8,
    },
    devButtonText: {
        fontFamily: 'Raleway',
        fontSize: 11,
        color: DesignTokens.colors.textMuted,
        opacity: 0.5,
    },
});
