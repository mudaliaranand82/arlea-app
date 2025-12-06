import { router } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { auth, db } from '../../../firebaseConfig';

export default function CreateBook() {
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        if (!title || !content) {
            Alert.alert("Missing Info", "Please provide a title and book content.");
            return;
        }

        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to publish.");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "books"), {
                title,
                genre,
                content, // Storing full text in Firestore for MVP
                authorId: auth.currentUser.uid,
                createdAt: new Date(),
                cover: "📚" // Default cover for now
            });

            Alert.alert("Success", "Book published successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", "Failed to publish book: " + error.message);
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
                    <Text style={[GlobalStyles.title, { color: Colors.author.primary, marginBottom: 0 }]}>New Book</Text>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Book Title</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. The Great Gatsby"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Genre</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. Classic Fiction"
                        value={genre}
                        onChangeText={setGenre}
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Book Content</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>Paste your book text here (simulating upload).</Text>
                    <TextInput
                        style={[GlobalStyles.input, { height: 200, textAlignVertical: 'top' }]}
                        placeholder="Chapter 1..."
                        value={content}
                        onChangeText={setContent}
                        multiline
                    />

                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: Colors.author.primary, marginTop: 10 }]}
                        onPress={handlePublish}
                        disabled={loading}
                    >
                        <Text style={GlobalStyles.buttonText}>{loading ? "Publishing..." : "Publish Book"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
