import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';

import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Check for user role
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'author') {
                    router.replace('/dashboard/author');
                } else if (userData.role === 'reader') {
                    router.replace('/dashboard/reader');
                } else {
                    // No role found, redirect to selection
                    router.replace('/role-selection');
                }
            } else {
                // Should not happen for valid users, but handle fallback
                router.replace('/role-selection');
            }
        } catch (error: any) {
            Alert.alert("Login Failed", error.message);
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
            console.error("Google Sign In Error:", error);
            Alert.alert("Google Sign In Failed", error.message);
        } finally {
            setLoading(false);
        }
    };


    const checkUserAndRedirect = async (user: any) => {
        // console.log("Checking user role for:", user.uid);
        Alert.alert("Debug", `Auth success! Checking DB for ${user.uid}`);

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            // console.log("User doc exists:", userDoc.exists());

            if (userDoc.exists()) {
                const userData = userDoc.data();
                // console.log("User data:", userData);

                if (userData.role === 'author') {
                    // console.log("Redirecting to Author Dashboard");
                    router.replace('/dashboard/author');
                } else if (userData.role === 'reader') {
                    // console.log("Redirecting to Reader Dashboard");
                    router.replace('/dashboard/reader');
                } else {
                    // console.log("No role found, redirecting to Selection");
                    router.replace('/role-selection');
                }
            } else {
                // console.log("New user, creating profile...");
                // New user via social auth
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    createdAt: new Date()
                });
                Alert.alert("Debug", "Profile created. Moving to selection.");
                router.replace('/role-selection');
            }
        } catch (error: any) {
            console.error("Error in checkUserAndRedirect:", error);
            Alert.alert("Error", "Failed to get user profile: " + error.message);
        }
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { justifyContent: 'center', backgroundColor: Colors.classic.background }]}>
            <View style={{ marginBottom: 30 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary, textAlign: 'center' }]}>Welcome Back</Text>
                <Text style={[GlobalStyles.subtitle, { textAlign: 'center', color: Colors.classic.textSecondary }]}>Sign in to continue your journey</Text>
            </View>

            <View style={GlobalStyles.card}>
                <Text style={{ marginBottom: 5, fontWeight: '600', color: Colors.classic.text }}>Email</Text>
                <TextInput
                    style={GlobalStyles.input}
                    placeholder="hello@example.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={{ marginBottom: 5, fontWeight: '600', color: Colors.classic.text }}>Password</Text>
                <TextInput
                    style={GlobalStyles.input}
                    placeholder="********"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                    <Text style={{ color: Colors.classic.primary }}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary }]}
                    onPress={handleSignIn}
                >
                    <Text style={GlobalStyles.buttonText}>Sign In</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: Colors.classic.border }} />
                    <Text style={{ marginHorizontal: 10, color: Colors.classic.textSecondary }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: Colors.classic.border }} />
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: 'white', borderWidth: 1, borderColor: Colors.classic.border, marginBottom: 10 }]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                >
                    <Text style={[GlobalStyles.buttonText, { color: Colors.classic.text }]}>Continue with Google</Text>
                </TouchableOpacity>

            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
                <Text style={{ color: Colors.classic.textSecondary }}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
                    <Text style={{ color: Colors.classic.primary, fontWeight: 'bold' }}>Sign Up</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={{ marginTop: 40, alignSelf: 'center' }}
                onPress={() => router.back()}
            >
                <Text style={{ color: Colors.classic.textSecondary }}>Back to Home</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
