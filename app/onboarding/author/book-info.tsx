import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../firebaseConfig';

const GENRES = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Thriller", "Horror", "Historical Fiction", "Non-Fiction", "Other"];

export default function BookInfo() {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [showGenreModal, setShowGenreModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (!title || !genre) {
            Alert.alert("Missing Info", "Please enter a title and select a genre.");
            return;
        }

        if (!user) {
            Alert.alert("Error", "You must be logged in.");
            return;
        }

        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, "books"), {
                title,
                genre,
                authorId: user.uid,
                createdAt: new Date(),
                cover: "📚" // Default placeholder
            });
            console.log("Book created with ID: ", docRef.id);
            router.push({ pathname: '/onboarding/author/create-character', params: { bookId: docRef.id } });
        } catch (e: any) {
            console.error("Error adding book: ", e);
            Alert.alert("Error", "Failed to save book: " + e.message);
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
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Tell us about your book</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>This information helps us set up your world.</Text>

                <View style={[GlobalStyles.card, { borderColor: Colors.classic.border, backgroundColor: Colors.classic.surface }]}>
                    <Text style={{ marginBottom: 5, fontWeight: '600', color: Colors.classic.text }}>Book Title</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. The Hobbit"
                        placeholderTextColor="#999"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600', color: Colors.classic.text }}>Genre</Text>
                    <TouchableOpacity
                        style={[GlobalStyles.input, { justifyContent: 'center' }]}
                        onPress={() => setShowGenreModal(true)}
                    >
                        <Text style={{ color: genre ? Colors.classic.text : '#999' }}>{genre || "Select a genre"}</Text>
                    </TouchableOpacity>
                </View>

                <Modal visible={showGenreModal} animationType="slide" transparent={true}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' }}>
                            <Text style={[GlobalStyles.heading, { textAlign: 'center' }]}>Select Genre</Text>
                            <ScrollView>
                                {GENRES.map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                                        onPress={() => {
                                            setGenre(g);
                                            setShowGenreModal(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, color: Colors.classic.text, textAlign: 'center' }}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={{ marginTop: 10, alignSelf: 'center' }} onPress={() => setShowGenreModal(false)}>
                                <Text style={{ color: Colors.classic.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleNext}
                    disabled={loading}
                >
                    <Text style={GlobalStyles.buttonText}>{loading ? "Saving..." : "Create Book & Continue"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
