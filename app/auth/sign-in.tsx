import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';

import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db, firebaseConfig } from '../../firebaseConfig';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

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
        addLog("Starting Google Sign In...");
        addLog(`API Key Configured: ${firebaseConfig.apiKey ? "YES (" + firebaseConfig.apiKey.substring(0, 4) + "...)" : "NO"}`);
        try {
            const provider = new GoogleAuthProvider();
            // Critical fix: Force Google to show account picker every time
            provider.setCustomParameters({ prompt: 'select_account' });

            addLog("Opening popup...");
            const result = await signInWithPopup(auth, provider);
            addLog(`Popup closed. User: ${result.user.uid}`);
            await checkUserAndRedirect(result.user);
        } catch (error: any) {
            addLog(`Google Error: ${error.message}`);
            console.error("Google Sign In Error:", error);
            Alert.alert("Google Sign In Failed", error.message);
        } finally {
            setLoading(false);
        }
    };


    const checkUserAndRedirect = async (user: any) => {
        addLog(`Checking DB for user ${user.uid}...`);

        try {
            // Log config presence just to be sure
            addLog(`DB Instance: ${db ? 'Initialized' : 'MISSING'}`);
            addLog(`Project ID: ${firebaseConfig.projectId}`);

            // Timeout promise
            addLog("Starting race against timeout...");
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore operation timed out (10s)")), 10000)
            );

            // Race getDoc against timeout
            const userDoc: any = await Promise.race([
                getDoc(doc(db, "users", user.uid)),
                timeout
            ]);

            addLog(`Doc exists? ${userDoc.exists()}`);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                addLog(`User Role: ${userData?.role}`);

                if (userData.role === 'author') {
                    addLog("Checking for existing books...");

                    // Timeout for books query
                    const bookTimeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Book query timed out")), 10000)
                    );

                    const booksQ = query(collection(db, "books"), where("authorId", "==", user.uid), limit(1));

                    const booksSnap: any = await Promise.race([
                        getDocs(booksQ),
                        bookTimeout
                    ]);

                    if (!booksSnap.empty) {
                        addLog("Has books. Redirecting...");
                        router.replace('/dashboard/author');
                    } else {
                        addLog("No books. Redirecting to Onboarding...");
                        router.replace('/onboarding/author/welcome');
                    }
                } else if (userData.role === 'reader') {
                    addLog("Redirecting to Reader...");
                    router.replace('/dashboard/reader');
                } else {
                    addLog("No role. Redirecting to Selection...");
                    router.replace('/role-selection');
                }
            } else {
                addLog("New user. Creating profile...");
                // New user via social auth
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    createdAt: new Date()
                });
                addLog("Profile created. Redirecting to Selection...");
                router.replace('/role-selection');
            }
        } catch (error: any) {
            addLog(`DB Error: ${error.message}`);
            console.error("Error in checkUserAndRedirect:", error);
            Alert.alert("Error", "Failed to get user profile: " + error.message);
        }
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { justifyContent: 'center', backgroundColor: Colors.classic.background }]}>
            <View style={{ marginBottom: 30 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary, textAlign: 'center' }]}>Welcome Back</Text>
                <Text style={{ textAlign: 'center', fontSize: 10, color: 'gray' }}>v1.2 (Long Polling)</Text>
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

            {/* ERROR / DEBUG LOG DISPLAY */}
            <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, width: '100%', maxHeight: 200 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Debug Logs:</Text>
                {debugLog.map((log, i) => (
                    <Text key={i} style={{ fontSize: 10, fontFamily: 'SpaceMono' }}>{log}</Text>
                ))}
            </View>
        </SafeAreaView>
    );
}
