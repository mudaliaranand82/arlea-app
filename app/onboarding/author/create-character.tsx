import { router, useLocalSearchParams } from 'expo-router';
import { signOut } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../firebaseConfig';

export default function CreateCharacter() {
    const { user } = useAuth();
    const { bookId } = useLocalSearchParams();
    const [name, setName] = useState('');
    const [role, setRole] = useState('Protagonist'); // Default
    const [personality, setPersonality] = useState('');
    const [backstory, setBackstory] = useState('');
    const [speakingStyle, setSpeakingStyle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async (finish: boolean) => {
        if (!name || !personality) {
            Alert.alert("Missing Info", "Please enter a name and personality traits.");
            return;
        }

        setLoading(true);
        console.log("Saving character...", { finish });

        try {
            if (!user) {
                Alert.alert("Error", "You must be logged in.");
                return;
            }

            const docReference = await addDoc(collection(db, "characters"), {
                bookId,
                authorId: user.uid,
                name,
                role,
                personality,
                backstory,
                speakingStyle,
                createdAt: new Date()
            });
            console.log("Character saved with ID:", docReference.id);

            if (finish) {
                console.log("Finishing... Redirecting to Dashboard");
                router.replace('/dashboard/author');
            } else {
                console.log("Adding another...");
                // Reset form for next character
                setName('');
                setRole('Protagonist');
                setPersonality('');
                setBackstory('');
                setSpeakingStyle('');
                Alert.alert("Success", "Character saved! Add another one.");
            }
        } catch (e: any) {
            console.error("Error adding character: ", e);
            Alert.alert("Error", "Failed to save character: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20 }}>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={{ fontFamily: 'Outfit_500Medium', color: Colors.classic.textSecondary }}>Log Out</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Add Character</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>
                    Who inhabits this world?
                </Text>

                <View style={[GlobalStyles.card, { borderColor: Colors.classic.border, backgroundColor: Colors.classic.surface }]}>
                    <Text style={styles.label}>Character Name</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. Frodo Baggins"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Role</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                        {['Protagonist', 'Antagonist', 'Side'].map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 16,
                                    borderRadius: 20,
                                    backgroundColor: role === r ? Colors.classic.primary : '#eee',
                                }}
                                onPress={() => setRole(r)}
                            >
                                <Text style={{ color: role === r ? 'white' : Colors.classic.text }}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Personality Traits</Text>
                    <TextInput
                        style={[GlobalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="e.g. Brave, loyal, anxious..."
                        multiline
                        value={personality}
                        onChangeText={setPersonality}
                    />

                    <Text style={styles.label}>Backstory (Context)</Text>
                    <TextInput
                        style={[GlobalStyles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="Where do they come from? What motivates them?"
                        multiline
                        value={backstory}
                        onChangeText={setBackstory}
                    />

                    <Text style={styles.label}>Speaking Style</Text>
                    <TextInput
                        style={[GlobalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="e.g. Formal, uses slang, stutters..."
                        multiline
                        value={speakingStyle}
                        onChangeText={setSpeakingStyle}
                    />
                </View>

                <View style={{ gap: 10, marginBottom: 40 }}>
                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: Colors.classic.secondary }]}
                        onPress={() => handleSave(false)}
                        disabled={loading}
                    >
                        <Text style={[GlobalStyles.buttonText, { color: Colors.classic.primary }]}>{loading ? "Saving..." : "Save & Add Another"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary }]}
                        onPress={() => handleSave(true)}
                        disabled={loading}
                    >
                        <Text style={GlobalStyles.buttonText}>{loading ? "Saving..." : "Save & Finish"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = {
    label: {
        marginBottom: 8,
        fontWeight: '600' as '600',
        color: Colors.classic.text,
        fontSize: 16,
    }
};
