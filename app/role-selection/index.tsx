import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../components/AnimatedButton';
import { AnimatedCard } from '../../components/AnimatedCard';
import { TopNav } from '../../components/TopNav';
import { DesignTokens } from '../../constants/DesignSystem';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../firebaseConfig';

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
            <TopNav showLogout onLogout={handleLogout} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
                    <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
                        HOW WILL YOU USE ARLEA?
                    </Text>
                    <Text style={styles.subheadline}>
                        Choose your primary experience. You can switch anytime.
                    </Text>
                </View>

                {/* Cards Container */}
                <View style={[styles.cardsContainer, isDesktop && styles.cardsContainerDesktop]}>
                    {/* Author Card - Wine Berry accent */}
                    <AnimatedCard
                        variant="accent"
                        onPress={() => handleRoleSelect('author')}
                        disabled={loading}
                        style={isDesktop ? styles.cardDesktop : styles.cardMobile}
                    >
                        <View style={styles.cardLabel}>
                            <Text style={styles.cardLabelText}>AUTHOR</Text>
                        </View>
                        <View style={styles.cardIcon}>
                            <Text style={styles.cardIconText}>✍️</Text>
                        </View>
                        <Text style={styles.cardTitle}>BRING CHARACTERS TO LIFE</Text>
                        <Text style={styles.cardDescription}>
                            Create AI-powered characters that readers can chat with. Define their personality, knowledge, and voice.
                        </Text>
                        <View style={styles.cardButtonContainer}>
                            <Text style={styles.cardButtonTextDark}>GET STARTED</Text>
                            <Text style={styles.cardButtonArrow}>→</Text>
                        </View>
                    </AnimatedCard>

                    {/* Reader Card - Light */}
                    <AnimatedCard
                        variant="light"
                        onPress={() => handleRoleSelect('reader')}
                        disabled={loading}
                        style={isDesktop ? styles.cardDesktop : styles.cardMobile}
                    >
                        <View style={[styles.cardLabel, styles.cardLabelDark]}>
                            <Text style={styles.cardLabelText}>READER</Text>
                        </View>
                        <View style={styles.cardIcon}>
                            <Text style={styles.cardIconText}>📖</Text>
                        </View>
                        <Text style={styles.cardTitleDark}>EXPLORE & CHAT</Text>
                        <Text style={styles.cardDescriptionDark}>
                            Discover published books and have conversations with their characters. Ask questions, explore stories.
                        </Text>
                        <AnimatedButton variant="primary" style={styles.cardButton}>
                            <Text style={styles.cardButtonTextLight}>GET STARTED</Text>
                            <Text style={styles.cardButtonArrowLight}>→</Text>
                        </AnimatedButton>
                    </AnimatedCard>
                </View>
            </ScrollView>

            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <Text style={styles.loadingText}>SETTING UP YOUR PROFILE...</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    hero: {
        paddingHorizontal: 20,
        paddingVertical: 40,
        alignItems: 'center',
    },
    heroDesktop: {
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    headline: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 28,
        color: DesignTokens.colors.text,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 1,
    },
    headlineDesktop: {
        fontSize: 48,
        letterSpacing: 2,
    },
    subheadline: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: DesignTokens.colors.textLight,
        textAlign: 'center',
        maxWidth: 400,
    },
    cardsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 24,
    },
    cardsContainerDesktop: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 40,
        gap: 32,
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    cardMobile: {
        width: '100%',
    },
    cardDesktop: {
        flex: 1,
        maxWidth: 400,
    },
    cardLabel: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        marginBottom: 20,
    },
    cardLabelDark: {
        backgroundColor: DesignTokens.colors.text,
        borderColor: DesignTokens.colors.text,
    },
    cardLabelText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 11,
        color: '#fff',
        letterSpacing: 2,
    },
    cardIcon: {
        marginBottom: 16,
    },
    cardIconText: {
        fontSize: 48,
    },
    cardTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 22,
        color: '#fff',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    cardTitleDark: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 22,
        color: DesignTokens.colors.text,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    cardDescription: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 22,
        marginBottom: 24,
    },
    cardDescriptionDark: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
        lineHeight: 22,
        marginBottom: 24,
    },
    cardButton: {
        alignSelf: 'flex-start',
    },
    // White button on Wine Berry card
    cardButtonContainer: {
        alignSelf: 'flex-start',
        backgroundColor: DesignTokens.colors.background,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: DesignTokens.borders.regular,
        borderColor: DesignTokens.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        // Hard offset shadow
        shadowColor: DesignTokens.colors.border,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    cardButtonTextDark: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
    cardButtonArrow: {
        fontSize: 16,
        color: DesignTokens.colors.text,
    },
    cardButtonTextLight: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: '#fff',
        letterSpacing: 0.5,
    },
    cardButtonArrowLight: {
        fontSize: 16,
        color: '#fff',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: DesignTokens.colors.modalOverlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        backgroundColor: DesignTokens.colors.background,
        paddingHorizontal: 32,
        paddingVertical: 24,
        borderWidth: DesignTokens.borders.thick,
        borderColor: DesignTokens.colors.border,
        // Hard offset shadow
        shadowColor: DesignTokens.colors.border,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
    },
    loadingText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        letterSpacing: 1,
    },
});
