import { router } from 'expo-router';
import { deleteUser, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
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

    const handleResetProfile = () => {
        if (!auth.currentUser) return;

        // Use standard window.confirm for Web if available (Expo Web), otherwise Alert for Native
        if (typeof window !== 'undefined' && window.confirm) {
            const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
            if (!confirmed) return;
            executeDelete();
            return;
        }

        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: executeDelete }
            ]
        );
    };

    const executeDelete = async () => {
        if (!auth.currentUser) return;
        try {
            await deleteDoc(doc(db, "users", auth.currentUser.uid));
            await deleteUser(auth.currentUser);
            router.replace('/');
            alert("Account deleted successfully.");
        } catch (e: any) {
            console.error("Delete Account Error:", e);
            if (e.code === 'auth/requires-recent-login') {
                alert("Please log out and log back in before deleting your account for security reasons.");
            } else {
                alert("Failed to delete account. Please try again.");
            }
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
                        onPress={handleResetProfile}
                        style={{ backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 5, borderWidth: 1, borderColor: '#ef4444' }}
                    >
                        <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Reset Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                    >
                        <Text style={{ color: '#374151', fontSize: 12, fontWeight: '600' }}>Log Out</Text>
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
