import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../components/AnimatedButton';
import { DesignTokens } from '../../constants/DesignSystem';

import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
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
            {/* Warm gradient background */}
            <LinearGradient
                colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(500)}
                style={styles.header}
            >
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backArrow}>{'<'}</Text>
                    <Text style={styles.backText}>Back</Text>
                </Pressable>

                <View style={styles.logoContainer}>
                    <Text style={styles.logoAccent}>~</Text>
                    <Text style={styles.logo}>Arlea</Text>
                    <Text style={styles.logoAccent}>~</Text>
                </View>

                <View style={{ width: 60 }} />
            </Animated.View>

            <ScrollView
                contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Welcome Message */}
                <Animated.View
                    entering={FadeInUp.duration(600).delay(200)}
                    style={styles.welcomeContainer}
                >
                    <Text style={styles.welcomeOrnament}>"</Text>
                    <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
                        Welcome Back
                    </Text>
                    <View style={styles.goldLine} />
                    <Text style={styles.subtitle}>
                        Continue your literary journey
                    </Text>
                </Animated.View>

                {/* Error Banner */}
                {error && (
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        style={styles.errorBanner}
                    >
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                )}

                {/* Form Card */}
                <Animated.View
                    entering={FadeInUp.duration(600).delay(400)}
                    style={[styles.card, isDesktop && styles.cardDesktop]}
                >
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'email' && styles.inputFocused
                            ]}
                            placeholder="you@example.com"
                            placeholderTextColor={DesignTokens.colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Password</Text>
                            <Pressable>
                                <Text style={styles.forgotLink}>Forgot password?</Text>
                            </Pressable>
                        </View>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'password' && styles.inputFocused
                            ]}
                            placeholder="Enter your password"
                            placeholderTextColor={DesignTokens.colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            secureTextEntry
                        />
                    </View>

                    <AnimatedButton
                        variant="primary"
                        onPress={handleSignIn}
                        size="lg"
                        style={styles.submitButton}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? "Signing In..." : "Sign In"}
                        </Text>
                    </AnimatedButton>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Login */}
                    <AnimatedButton
                        variant="secondary"
                        onPress={handleGoogleSignIn}
                        size="lg"
                        disabled={loading}
                    >
                        <Text style={styles.googleButtonText}>Google</Text>
                    </AnimatedButton>
                </Animated.View>

                {/* Footer */}
                <Animated.View
                    entering={FadeIn.duration(500).delay(600)}
                    style={styles.footer}
                >
                    <Text style={styles.footerText}>New to Arlea? </Text>
                    <Pressable onPress={() => router.push('/auth/sign-up')}>
                        <Text style={styles.footerLink}>Create an account</Text>
                    </Pressable>
                </Animated.View>
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
    },
    backArrow: {
        fontFamily: 'Lora',
        fontSize: 18,
        color: DesignTokens.colors.textSecondary,
    },
    backText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 14,
        color: DesignTokens.colors.textSecondary,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logo: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 22,
        color: DesignTokens.colors.text,
    },
    logoAccent: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 18,
        color: DesignTokens.colors.accent,
    },

    // Content
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    contentDesktop: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },

    // Welcome
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    welcomeOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 80,
        color: DesignTokens.colors.accent,
        opacity: 0.2,
        position: 'absolute',
        top: -50,
    },
    title: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 36,
        color: DesignTokens.colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    titleDesktop: {
        fontSize: 48,
    },
    goldLine: {
        width: 50,
        height: 2,
        backgroundColor: DesignTokens.colors.accent,
        marginBottom: 16,
        borderRadius: 1,
    },
    subtitle: {
        fontFamily: 'Lora',
        fontSize: 16,
        color: DesignTokens.colors.textSecondary,
        textAlign: 'center',
    },

    // Error
    errorBanner: {
        backgroundColor: 'rgba(165, 74, 74, 0.1)',
        borderWidth: 1,
        borderColor: DesignTokens.colors.error,
        borderRadius: DesignTokens.radius.md,
        padding: 16,
        marginBottom: 20,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
    },
    errorText: {
        fontFamily: 'Lora',
        color: DesignTokens.colors.error,
        fontSize: 14,
        textAlign: 'center',
    },

    // Form Card
    card: {
        backgroundColor: DesignTokens.colors.surface,
        borderRadius: DesignTokens.radius.xl,
        padding: 28,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        ...DesignTokens.shadows.elevated,
    },
    cardDesktop: {
        padding: 40,
    },

    // Inputs
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontFamily: 'Raleway-Medium',
        fontSize: 13,
        color: DesignTokens.colors.textSecondary,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    forgotLink: {
        fontFamily: 'Lora',
        fontSize: 13,
        color: DesignTokens.colors.accent,
        marginBottom: 10,
    },
    input: {
        backgroundColor: DesignTokens.colors.backgroundAlt,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        borderRadius: DesignTokens.radius.md,
        paddingVertical: 16,
        paddingHorizontal: 18,
        fontSize: 16,
        fontFamily: 'Lora',
        color: DesignTokens.colors.text,
    },
    inputFocused: {
        borderColor: DesignTokens.colors.accent,
        backgroundColor: DesignTokens.colors.surface,
    },

    // Submit Button
    submitButton: {
        marginTop: 8,
        marginBottom: 24,
    },
    submitButtonText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 15,
        color: DesignTokens.colors.textOnAccent,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: DesignTokens.colors.border,
    },
    dividerText: {
        fontFamily: 'Raleway',
        fontSize: 13,
        color: DesignTokens.colors.textMuted,
        marginHorizontal: 16,
    },

    // Google
    googleButtonText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 15,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontFamily: 'Lora',
        fontSize: 15,
        color: DesignTokens.colors.textSecondary,
    },
    footerLink: {
        fontFamily: 'Lora-Medium',
        fontSize: 15,
        color: DesignTokens.colors.accent,
    },
});
