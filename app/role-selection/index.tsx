import { router } from 'expo-router';
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

    const handleRoleSelect = async (role: 'author' | 'reader') => {
        if (!user) {
            Alert.alert("Error", "No authenticated user found.");
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                role: role
            });

            // Redirect to the role-specific onboarding welcome screen
            if (role === 'author') {
                router.replace('/onboarding/author/welcome');
            } else {
                router.replace('/onboarding/reader/welcome');
            }
        } catch (error: any) {
            console.error("Error updating role:", error);
            Alert.alert("Error", "Failed to save your selection. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <View style={styles.header}>
                <Text style={styles.title}>How will you use Arlea?</Text>
                <Text style={styles.subtitle}>Choose your primary experience. You can switch later.</Text>
            </View>

            <View style={styles.content}>
                <ActionCard
                    title="I am an Author"
                    subtitle="Create worlds, characters, and stories."
                    backgroundColor={Colors.classic.surface}
                    textColor={Colors.classic.text}
                    onPress={() => handleRoleSelect('author')}
                    disabled={loading}
                />

                <ActionCard
                    title="I am a Reader"
                    subtitle="Chat with characters and explore stories."
                    backgroundColor={Colors.classic.surface}
                    textColor={Colors.classic.text}
                    onPress={() => handleRoleSelect('reader')}
                    disabled={loading}
                />
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Setting up your profile...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 40,
        marginBottom: 40,
        alignItems: 'center',
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
