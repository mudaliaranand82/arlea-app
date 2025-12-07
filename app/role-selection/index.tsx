import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionCard } from '../../components/ui/ActionCard';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

export default function RoleSelectionScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const handleRoleSelect = async (role: 'author' | 'reader') => {
        if (!user) {
            Alert.alert("Error", "No authenticated user found.");
            return;
        }

        setLoading(true);
        addLog(`Selecting role: ${role}`);

        try {
            const userRef = doc(db, "users", user.uid);
            addLog("Doc ref created. Updating...");

            // Timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore update timed out")), 10000)
            );

            // Race updateDoc against timeout
            await Promise.race([
                updateDoc(userRef, { role: role }),
                timeout
            ]);

            addLog("Update successful!");

            // Redirect to the role-specific onboarding welcome screen
            if (role === 'author') {
                addLog("Redirecting to Author Welcome...");
                router.replace('/onboarding/author/welcome');
            } else {
                addLog("Redirecting to Reader Welcome...");
                router.replace('/onboarding/reader/welcome');
            }
        } catch (error: any) {
            console.error("Error updating role:", error);
            addLog(`Error: ${error.message}`);
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
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
                <Text style={styles.title}>How will you use Arlea?</Text>
                <Text style={styles.subtitle}>Choose your primary experience. You can switch later.</Text>
            </View>

            <View style={styles.content}>
                <ActionCard
                    title="I am an Author"
                    subtitle="Create worlds, characters, and stories."
                    backgroundColor={Colors.classic.surface}
                    textColor={Colors.classic.primary} // Wine Berry
                    onPress={() => handleRoleSelect('author')}
                    disabled={loading}
                    style={{ borderColor: Colors.classic.secondary }} // Azalea
                />

                <ActionCard
                    title="I am a Reader"
                    subtitle="Chat with characters and explore stories."
                    backgroundColor={Colors.classic.surface}
                    textColor={Colors.classic.textSecondary} // Use generic text for secondary option, or primary if both equal
                    onPress={() => handleRoleSelect('reader')}
                    disabled={loading}
                    style={{ borderColor: Colors.classic.border }}
                />
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Setting up your profile...</Text>
                </View>
            )}

            {/* ERROR / DEBUG LOG DISPLAY */}
            <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, width: '100%', maxHeight: 150, alignSelf: 'center', opacity: debugLog.length > 0 ? 1 : 0 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Debug Logs:</Text>
                {debugLog.map((log, i) => (
                    <Text key={i} style={{ fontSize: 10, fontFamily: 'SpaceMono' }}>{log}</Text>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 20,
        marginBottom: 30,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoutButton: {
        alignSelf: 'flex-end',
        padding: 8,
        marginBottom: 10,
    },
    logoutText: {
        fontFamily: 'Outfit_500Medium',
        color: Colors.classic.textSecondary,
        fontSize: 14,
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 28,
        color: Colors.classic.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: Colors.classic.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    content: {
        flex: 1,
        gap: 20,
        paddingHorizontal: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 18,
        color: Colors.classic.primary,
        marginTop: 10,
    }
});
