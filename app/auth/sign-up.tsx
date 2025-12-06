import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'author' | 'reader'>('reader');
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

            // Save user profile to Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                role: role,
                createdAt: new Date()
            });
            console.log("User profile saved to Firestore");

            // Navigate based on role
            console.log("Navigating to:", role === 'author' ? '/dashboard/author' : '/dashboard/reader');
            if (role === 'author') {
                router.replace('/dashboard/author');
            } else {
                router.replace('/dashboard/reader');
            }
        } catch (error: any) {
            console.error("Sign Up Error:", error);
            Alert.alert("Registration Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { justifyContent: 'center' }]}>
            <View style={{ marginBottom: 30 }}>
                <Text style={[GlobalStyles.title, { color: Colors.author.primary, textAlign: 'center' }]}>Create Account</Text>
                <Text style={[GlobalStyles.subtitle, { textAlign: 'center' }]}>Join Arlea today</Text>
            </View>

            <View style={GlobalStyles.card}>
                <Text style={{ marginBottom: 5, fontWeight: '600' }}>Email</Text>
                <TextInput
                    style={GlobalStyles.input}
                    placeholder="hello@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={{ marginBottom: 5, fontWeight: '600' }}>Password</Text>
                <TextInput
                    style={GlobalStyles.input}
                    placeholder="********"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Text style={{ marginBottom: 5, fontWeight: '600' }}>Confirm Password</Text>
                <TextInput
                    style={GlobalStyles.input}
                    placeholder="********"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                <Text style={{ marginBottom: 5, fontWeight: '600' }}>I am a...</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <TouchableOpacity
                        style={[
                            GlobalStyles.card,
                            { flex: 1, padding: 10, backgroundColor: role === 'reader' ? Colors.reader.primary : '#f0f0f0', alignItems: 'center' }
                        ]}
                        onPress={() => setRole('reader')}
                    >
                        <Text style={{ color: role === 'reader' ? 'white' : 'black', fontWeight: 'bold' }}>Reader</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            GlobalStyles.card,
                            { flex: 1, padding: 10, backgroundColor: role === 'author' ? Colors.author.primary : '#f0f0f0', alignItems: 'center' }
                        ]}
                        onPress={() => setRole('author')}
                    >
                        <Text style={{ color: role === 'author' ? 'white' : 'black', fontWeight: 'bold' }}>Author</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: role === 'author' ? Colors.author.primary : Colors.reader.primary, marginTop: 10 }]}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    <Text style={GlobalStyles.buttonText}>{loading ? "Creating Account..." : "Sign Up"}</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
                    <Text style={{ marginHorizontal: 10, color: '#666' }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc', marginBottom: 10 }]}
                    onPress={() => alert("Google Auth not configured yet (requires Client ID)")}
                >
                    <Text style={[GlobalStyles.buttonText, { color: 'black' }]}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: 'black' }]}
                    onPress={() => alert("Apple Auth requires native device")}
                >
                    <Text style={[GlobalStyles.buttonText, { color: 'white' }]}>Continue with Apple</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
                <Text style={{ color: '#666' }}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
                    <Text style={{ color: Colors.author.primary, fontWeight: 'bold' }}>Sign In</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={{ marginTop: 40, alignSelf: 'center' }}
                onPress={() => router.back()}
            >
                <Text style={{ color: '#999' }}>Back to Home</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
