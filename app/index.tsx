import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { AnimatedButton } from '../components/AnimatedButton';
import { DesignTokens } from '../constants/DesignSystem';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebaseConfig';

const { width: screenWidth } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'WHERE STORIES COME ALIVE',
        subtitle: 'Experience books like never before with interactive characters and worlds.',
        image: require('../assets/images/onboarding-1.png'),
    },
    {
        id: '2',
        title: 'CREATE YOUR UNIVERSE',
        subtitle: 'Authors can build rich worlds and characters that readers can interact with.',
        image: require('../assets/images/onboarding-2.png'),
    },
    {
        id: '3',
        title: 'CHAT WITH CHARACTERS',
        subtitle: 'Don\'t just read the story. Talk to the protagonist and shape the narrative.',
        image: require('../assets/images/onboarding-3.png'),
    },
];

export default function WelcomeScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const { user, loading } = useAuth();

    React.useEffect(() => {
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
        scrollX.value = event.nativeEvent.contentOffset.x;
        const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
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

            {/* Top Nav - Just logo, no logout for landing */}
            <View style={[styles.nav, isDesktop && styles.navDesktop]}>
                <Text style={styles.logo}>ARLEA</Text>
                <View style={styles.navButtons}>
                    <AnimatedButton variant="outline" onPress={() => router.push('/auth/sign-in')}>
                        <Text style={styles.navButtonText}>LOG IN</Text>
                    </AnimatedButton>
                </View>
            </View>

            {/* Hero Carousel */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                    <View style={[styles.slide, { width: screenWidth }]}>
                        <Animated.Image
                            source={item.image}
                            style={[styles.image, isDesktop && styles.imageDesktop]}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
                            {item.title}
                        </Text>
                        <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>
                            {item.subtitle}
                        </Text>
                    </View>
                )}
            />

            {/* Footer */}
            <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
                {/* Pagination Dots - Brutalist style */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => {
                        const isActive = index === currentIndex;
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    isActive && styles.dotActive
                                ]}
                            />
                        );
                    })}
                </View>

                {/* CTA Buttons */}
                <View style={[styles.buttonContainer, isDesktop && styles.buttonContainerDesktop]}>
                    <AnimatedButton
                        variant="primary"
                        onPress={() => router.push('/auth/sign-up')}
                        style={styles.ctaButton}
                    >
                        <Text style={styles.ctaButtonTextLight}>JOIN FOR FREE</Text>
                        <Text style={styles.ctaArrowLight}>→</Text>
                    </AnimatedButton>

                    <AnimatedButton
                        variant="secondary"
                        onPress={() => router.push('/auth/sign-in')}
                        style={styles.ctaButton}
                    >
                        <Text style={styles.ctaButtonTextDark}>LOG IN</Text>
                        <Text style={styles.ctaArrowDark}>→</Text>
                    </AnimatedButton>
                </View>

                {/* Dev Reset - Subtle */}
                <AnimatedButton variant="outline" onPress={handleDevReset} style={styles.devButton}>
                    <Text style={styles.devButtonText}>DEV: RESET</Text>
                </AnimatedButton>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    nav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: DesignTokens.borders.regular,
        borderBottomColor: DesignTokens.colors.border,
    },
    navDesktop: {
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    logo: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: DesignTokens.colors.text,
        letterSpacing: 3,
    },
    navButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    navButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    image: {
        width: '80%',
        maxWidth: 280,
        height: 180,
        marginBottom: 24,
    },
    imageDesktop: {
        height: 240,
        maxWidth: 320,
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: DesignTokens.colors.text,
        marginBottom: 12,
        letterSpacing: 1,
        lineHeight: 32,
        textAlign: 'center',
    },
    titleDesktop: {
        fontSize: 36,
        lineHeight: 44,
        letterSpacing: 2,
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
        lineHeight: 22,
        textAlign: 'center',
        maxWidth: 320,
        paddingHorizontal: 10,
    },
    subtitleDesktop: {
        fontSize: 16,
        maxWidth: 400,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    footerDesktop: {
        paddingBottom: 60,
    },
    pagination: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    dot: {
        width: 12,
        height: 12,
        backgroundColor: DesignTokens.colors.background,
        borderWidth: 2,
        borderColor: DesignTokens.colors.border,
    },
    dotActive: {
        backgroundColor: DesignTokens.colors.primary,
        borderColor: DesignTokens.colors.primary,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        maxWidth: 400,
    },
    buttonContainerDesktop: {
        flexDirection: 'row',
        maxWidth: 500,
        justifyContent: 'center',
    },
    ctaButton: {
        flex: 1,
    },
    ctaButtonTextLight: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 0.5,
    },
    ctaArrowLight: {
        fontSize: 18,
        color: DesignTokens.colors.textOnPrimary,
    },
    ctaButtonTextDark: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
    ctaArrowDark: {
        fontSize: 18,
        color: DesignTokens.colors.text,
    },
    devButton: {
        marginTop: 24,
    },
    devButtonText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 10,
        color: DesignTokens.colors.textLight,
        letterSpacing: 0.5,
    },
});
