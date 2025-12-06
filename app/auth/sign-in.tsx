import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { Alert } from 'react-native';
import { auth } from '../../firebaseConfig';

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
            await signInWithEmailAndPassword(auth, email, password);
            router.replace('/dashboard/reader');
        } catch (error: any) {
            Alert.alert("Login Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { justifyContent: 'center' }]}>
            <View style={{ marginBottom: 30 }}>
                <Text style={[GlobalStyles.title, { color: Colors.reader.primary, textAlign: 'center' }]}>Welcome Back</Text>
                <Text style={[GlobalStyles.subtitle, { textAlign: 'center' }]}>Sign in to continue your journey</Text>
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

                <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                    <Text style={{ color: Colors.reader.primary }}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.reader.primary }]}
                    onPress={handleSignIn}
                >
                    <Text style={GlobalStyles.buttonText}>Sign In</Text>
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
                <Text style={{ color: '#666' }}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
                    <Text style={{ color: Colors.reader.primary, fontWeight: 'bold' }}>Sign Up</Text>
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
