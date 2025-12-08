import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../firebaseConfig';

export default function ReaderDashboard() {
    const { user, loading } = useAuth();
    const [recentBooks, setRecentBooks] = useState<any[]>([]);
    const [books, setBooks] = useState<any[]>([]);
    const [characters, setCharacters] = useState<any[]>([]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    useEffect(() => {
        if (!user) return;

        // 1. Listen to ALL books (Public Library style for now)
        // In a real app, you might filter by "published" or "public"
        const booksQ = query(collection(db, "books"));
        const unsubBooks = onSnapshot(booksQ, (snapshot) => {
            const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBooks(booksData);
        });

        // 2. Listen to ALL characters
        const charsQ = query(collection(db, "characters"));
        const unsubChars = onSnapshot(charsQ, (snapshot) => {
            const charsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCharacters(charsData);
        });

        return () => {
            unsubBooks();
            unsubChars();
        };
    }, [user]);

    const getCharactersForBook = (bookId: string) => {
        return characters.filter(c => c.bookId === bookId);
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Explore Worlds</Text>
                    <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>
                        Choose a character to start your journey.
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    {/* <TouchableOpacity onPress={() => router.push('/dashboard/reader/library')}>
                        <Text style={{ color: Colors.reader.primary }}>See All</Text>
                    </TouchableOpacity> */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={{ backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                    >
                        <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={books}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, paddingTop: 0 }}
                renderItem={({ item: book }) => {
                    const bookChars = getCharactersForBook(book.id);
                    if (bookChars.length === 0) return null; // Skip empty books

                    return (
                        <View style={{ marginBottom: 30 }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 20, color: Colors.classic.text, marginBottom: 10 }}>
                                {book.title} <Text style={{ fontSize: 14, color: '#999', fontWeight: 'normal' }}>({book.genre})</Text>
                            </Text>

                            {/* Horizontal scroll for characters within a book */}
                            <FlatList
                                data={bookChars}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(c) => c.id}
                                renderItem={({ item: char }) => (
                                    <TouchableOpacity
                                        style={{
                                            marginRight: 15,
                                            backgroundColor: Colors.classic.surface,
                                            padding: 15,
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: Colors.classic.border,
                                            width: 140,
                                            alignItems: 'center'
                                        }}
                                        onPress={() => router.push(`/reader/chat/${char.id}`)}
                                    >
                                        <View style={{
                                            width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.classic.primary + '20',
                                            justifyContent: 'center', alignItems: 'center', marginBottom: 10,
                                        }}>
                                            <Text style={{ fontSize: 24 }}>👤</Text>
                                        </View>
                                        <Text style={{ fontFamily: 'Outfit_600SemiBold', color: Colors.classic.text, textAlign: 'center' }}>
                                            {char.name}
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit_400Regular', color: Colors.classic.textSecondary, fontSize: 12, textAlign: 'center' }}>
                                            {char.role}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );
}
