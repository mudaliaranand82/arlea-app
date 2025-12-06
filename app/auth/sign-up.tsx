import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';

import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        setLoading(true);
        console.log("Starting sign up process...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created:", userCredential.user.uid);

            // Save user profile to Firestore (without role initially)
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                createdAt: new Date()
            });
            console.log("User profile saved to Firestore");

            // Navigate to Role Selection
            router.replace('/role-selection');

        } catch (error: any) {
            console.error("Sign Up Error:", error);
            Alert.alert("Registration Failed", error.message);
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
            console.error("Google Sign Up Error:", error);
            Alert.alert("Google Sign Up Failed", error.message);
        } finally {
            setLoading(false);
        }
    };


    const checkUserAndRedirect = async (user: any) => {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            // Create user profile
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date()
            });
        }

        // Always redirect to role selection for new/social sign ups that haven't selected a role, 
        // or dashboard if they already have one.
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
        <SafeAreaView style={[GlobalStyles.container, { justifyContent: 'center', backgroundColor: Colors.classic.background }]}>
            <View style={{ marginBottom: 30 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary, textAlign: 'center' }]}>Create Account</Text>
                <Text style={[GlobalStyles.subtitle, { textAlign: 'center', color: Colors.classic.textSecondary }]}>Join Arlea today</Text>
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

                <Text style={{ marginBottom: 5, fontWeight: '600', color: Colors.classic.text }}>Confirm Password</Text>
                <TextInput
                    style={GlobalStyles.input}
                    placeholder="********"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />



                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary, marginTop: 10 }]}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    <Text style={GlobalStyles.buttonText}>{loading ? "Creating Account..." : "Sign Up"}</Text>
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
                <Text style={{ color: Colors.classic.textSecondary }}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
                    <Text style={{ color: Colors.classic.primary, fontWeight: 'bold' }}>Sign In</Text>
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
