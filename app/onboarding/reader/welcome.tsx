import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { AnimatedCard } from '../../../components/AnimatedCard';
import { TopNav } from '../../../components/TopNav';
import { DesignTokens } from '../../../constants/DesignSystem';
import { auth } from '../../../firebaseConfig';

export default function ReaderWelcome() {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TopNav showLogout onLogout={handleLogout} />

            <ScrollView
                contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
                        WELCOME TO ARLEA!
                    </Text>
                    <Text style={styles.subtitle}>
                        Step into your favorite books and chat with the characters you love.
                    </Text>
                </View>

                {/* Steps Card - Match Author Welcome style */}
                <AnimatedCard
                    variant="light"
                    style={[styles.stepsCard, isDesktop && styles.stepsCardDesktop]}
                >
                    <Text style={styles.stepsTitle}>HOW IT WORKS</Text>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepLabel}>DISCOVER</Text>
                            <Text style={styles.stepDescription}>Browse published books and characters</Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepLabel}>CHAT</Text>
                            <Text style={styles.stepDescription}>Have real conversations with your favorites</Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepLabel}>EXPLORE</Text>
                            <Text style={styles.stepDescription}>Dive deeper into their world and story</Text>
                        </View>
                    </View>
                </AnimatedCard>

                {/* CTA */}
                <AnimatedButton
                    variant="primary"
                    onPress={() => router.push('/onboarding/reader/book-selection')}
                    style={styles.ctaButton}
                >
                    <Text style={styles.ctaButtonText}>ENTER WORLD</Text>
                    <Text style={styles.ctaButtonArrow}>→</Text>
                </AnimatedButton>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    content: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
    },
    contentDesktop: {
        paddingHorizontal: 40,
    },
    hero: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 28,
        color: DesignTokens.colors.primary,
        letterSpacing: 2,
        marginBottom: 12,
        textAlign: 'center',
    },
    titleDesktop: {
        fontSize: 40,
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: DesignTokens.colors.textLight,
        textAlign: 'center',
        maxWidth: 400,
        lineHeight: 24,
    },
    stepsCard: {
        width: '100%',
        maxWidth: 450,
    },
    stepsCardDesktop: {
        maxWidth: 500,
    },
    stepsTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        letterSpacing: 2,
        marginBottom: 24,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    stepNumber: {
        width: 32,
        height: 32,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepNumberText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.textOnPrimary,
    },
    stepContent: {
        flex: 1,
    },
    stepLabel: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        letterSpacing: 1,
        marginBottom: 4,
    },
    stepDescription: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
        lineHeight: 20,
    },
    ctaButton: {
        marginTop: 32,
        width: '100%',
        maxWidth: 450,
    },
    ctaButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 0.5,
    },
    ctaButtonArrow: {
        fontSize: 18,
        color: DesignTokens.colors.textOnPrimary,
    },
});
