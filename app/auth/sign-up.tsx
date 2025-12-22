import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../components/AnimatedButton';
import { TopNav } from '../../components/TopNav';
import { DesignTokens } from '../../constants/DesignSystem';

import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const showAlert = (title: string, message: string) => {
        const fullMessage = `${title}: ${message}`;
        setError(fullMessage);
        if (typeof window !== 'undefined' && !window.navigator.userAgent.includes('Expo')) {
            window.alert(fullMessage);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleSignUp = async () => {
        setError(null);
        if (!email || !password || !confirmPassword) {
            showAlert("Error", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            showAlert("Error", "Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                createdAt: new Date()
            });
            router.replace('/role-selection');
        } catch (error: any) {
            showAlert("Registration Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await checkUserAndRedirect(result.user);
        } catch (error: any) {
            showAlert("Google Sign Up Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkUserAndRedirect = async (user: any) => {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date()
            });
        }

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'author') {
                router.replace('/dashboard/author');
            } else if (userData.role === 'reader') {
                router.replace('/dashboard/reader');
            } else {
                router.replace('/role-selection');
            }
        } else {
            router.replace('/role-selection');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TopNav showLogout={false} />

            <ScrollView
                contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, isDesktop && styles.titleDesktop]}>CREATE ACCOUNT</Text>
                    <Text style={styles.subtitle}>Join Arlea today</Text>
                </View>

                {/* Error Banner */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Form Card */}
                <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="hello@example.com"
                        placeholderTextColor={DesignTokens.colors.textLight}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={DesignTokens.colors.textLight}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={DesignTokens.colors.textLight}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <AnimatedButton
                        variant="primary"
                        onPress={handleSignUp}
                        style={styles.submitButton}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
                        </Text>
                        <Text style={styles.submitButtonArrow}>→</Text>
                    </AnimatedButton>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <AnimatedButton
                        variant="secondary"
                        onPress={handleGoogleSignIn}
                    >
                        <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
                    </AnimatedButton>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <AnimatedButton variant="outline" onPress={() => router.push('/auth/sign-in')}>
                        <Text style={styles.footerLink}>SIGN IN</Text>
                    </AnimatedButton>
                </View>

                <AnimatedButton
                    variant="outline"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← BACK TO HOME</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    contentDesktop: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 32,
        color: DesignTokens.colors.text,
        letterSpacing: 2,
        marginBottom: 8,
    },
    titleDesktop: {
        fontSize: 48,
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: DesignTokens.colors.textLight,
    },
    errorBanner: {
        backgroundColor: '#fee2e2',
        borderWidth: DesignTokens.borders.regular,
        borderColor: '#ef4444',
        padding: 16,
        marginBottom: 20,
        width: '100%',
        maxWidth: 450,
    },
    errorText: {
        fontFamily: 'Outfit_600SemiBold',
        color: '#dc2626',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: DesignTokens.colors.background,
        borderWidth: DesignTokens.borders.thick,
        borderColor: DesignTokens.colors.border,
        padding: DesignTokens.spacing.lg,
        width: '100%',
        maxWidth: 450,
        shadowColor: DesignTokens.colors.border,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
    },
    cardDesktop: {
        padding: 32,
    },
    label: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 11,
        color: DesignTokens.colors.text,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderWidth: DesignTokens.borders.regular,
        borderColor: DesignTokens.colors.border,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: DesignTokens.colors.text,
        marginBottom: 20,
    },
    submitButton: {
        marginBottom: 24,
        marginTop: 8,
    },
    submitButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 0.5,
    },
    submitButtonArrow: {
        fontSize: 18,
        color: DesignTokens.colors.textOnPrimary,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 2,
        backgroundColor: DesignTokens.colors.border,
    },
    dividerText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 11,
        color: DesignTokens.colors.textLight,
        marginHorizontal: 16,
        letterSpacing: 1,
    },
    googleButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
    },
    footerText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
    },
    footerLink: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.primary,
        letterSpacing: 0.5,
    },
    backButton: {
        marginTop: 24,
        alignSelf: 'center',
    },
    backButtonText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        letterSpacing: 0.5,
    },
});
