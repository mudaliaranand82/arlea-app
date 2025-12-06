import { router } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { auth, db } from '../../../firebaseConfig';

export default function CreateCharacter() {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [personality, setPersonality] = useState('');
    const [backstory, setBackstory] = useState('');
    const [selectedBookId, setSelectedBookId] = useState('');
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBooks = async () => {
            if (!auth.currentUser) return;
            const q = query(collection(db, "books"), where("authorId", "==", auth.currentUser.uid));
            const snapshot = await getDocs(q);
            const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBooks(booksData);
            if (booksData.length > 0) {
                setSelectedBookId(booksData[0].id);
            }
        };
        fetchBooks();
    }, []);

    const handleSave = async () => {
        if (!name || !role || !selectedBookId) {
            Alert.alert("Missing Info", "Please provide name, role, and select a book.");
            return;
        }

        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in.");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "characters"), {
                name,
                role,
                personality,
                backstory,
                bookId: selectedBookId,
                authorId: auth.currentUser.uid,
                createdAt: new Date()
            });

            Alert.alert("Success", "Character saved successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", "Failed to save character: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={GlobalStyles.container}>
            <ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                        <Text style={{ fontSize: 24 }}>←</Text>
                    </TouchableOpacity>
                    <Text style={[GlobalStyles.title, { color: Colors.author.primary, marginBottom: 0 }]}>New Character</Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Select Book</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                        {books.map((book) => (
                            <TouchableOpacity
                                key={book.id}
                                onPress={() => setSelectedBookId(book.id)}
                                style={{
                                    padding: 10,
                                    borderWidth: 1,
                                    borderColor: selectedBookId === book.id ? Colors.author.primary : '#ccc',
                                    backgroundColor: selectedBookId === book.id ? '#f0f8ff' : 'white',
                                    borderRadius: 8,
                                    marginRight: 10
                                }}
                            >
                                <Text style={{ color: selectedBookId === book.id ? Colors.author.primary : 'black' }}>{book.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Character Name</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. Sherlock Holmes"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Role</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. Protagonist, Villain, Sidekick"
                        value={role}
                        onChangeText={setRole}
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Personality Traits</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>Describe how they act and speak.</Text>
                    <TextInput
                        style={[GlobalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="e.g. Brilliant, arrogant, observant, socially awkward..."
                        value={personality}
                        onChangeText={setPersonality}
                        multiline
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Backstory</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>A brief history to give them context.</Text>
                    <TextInput
                        style={[GlobalStyles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="e.g. A consulting detective living in London..."
                        value={backstory}
                        onChangeText={setBackstory}
                        multiline
                    />

                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: Colors.author.primary, marginTop: 10 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={GlobalStyles.buttonText}>{loading ? "Saving..." : "Save Character"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
