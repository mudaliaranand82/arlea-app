import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../components/AnimatedButton';
import { TopNav } from '../../components/TopNav';
import { DesignTokens } from '../../constants/DesignSystem';

import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const handleSignIn = async () => {
        setError(null);
        if (!email || !password) {
            showAlert("Error", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

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
        } catch (error: any) {
            let errorMessage = error.message;
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email.";
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password.";
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password.";
            }
            showAlert("Login Failed", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
            await checkUserAndRedirect(result.user);
        } catch (error: any) {
            showAlert("Google Sign In Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkUserAndRedirect = async (user: any) => {
        try {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore operation timed out")), 10000)
            );

            const userDoc: any = await Promise.race([
                getDoc(doc(db, "users", user.uid)),
                timeout
            ]);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'author') {
                    const booksQ = query(collection(db, "books"), where("authorId", "==", user.uid), limit(1));
                    const booksSnap: any = await getDocs(booksQ);
                    if (!booksSnap.empty) {
                        router.replace('/dashboard/author');
                    } else {
                        router.replace('/onboarding/author/welcome');
                    }
                } else if (userData.role === 'reader') {
                    router.replace('/dashboard/reader');
                } else {
                    router.replace('/role-selection');
                }
            } else {
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    createdAt: new Date()
                });
                router.replace('/role-selection');
            }
        } catch (error: any) {
            showAlert("Error", "Failed to get user profile: " + error.message);
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
                    <Text style={[styles.title, isDesktop && styles.titleDesktop]}>WELCOME BACK</Text>
                    <Text style={styles.subtitle}>Sign in to continue your journey</Text>
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

                    <AnimatedButton variant="outline" style={styles.forgotButton}>
                        <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
                    </AnimatedButton>

                    <AnimatedButton
                        variant="primary"
                        onPress={handleSignIn}
                        style={styles.submitButton}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? "SIGNING IN..." : "SIGN IN"}
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
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <AnimatedButton variant="outline" onPress={() => router.push('/auth/sign-up')}>
                        <Text style={styles.footerLink}>SIGN UP</Text>
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
        // Hard offset shadow
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
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 11,
        color: DesignTokens.colors.textLight,
        letterSpacing: 0.5,
    },
    submitButton: {
        marginBottom: 24,
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
