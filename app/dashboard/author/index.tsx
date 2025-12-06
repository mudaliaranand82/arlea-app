import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../../../firebaseConfig';
import { SeedService } from '../../../services/seedService';

export default function AuthorDashboard() {
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribeSnapshot: () => void;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setError(null);
                const q = query(collection(db, "books"), where("authorId", "==", user.uid));

                unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setBooks(booksData);
                    setLoading(false);
                }, (err) => {
                    console.error("Error fetching books:", err);
                    setError(err.message);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        // Safety timeout
        const timeout = setTimeout(() => {
            if (loading) {
                setLoading(false);
                setError("Request timed out. Please check your connection.");
            }
        }, 10000);

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <SafeAreaView style={GlobalStyles.container}>
            <ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={[GlobalStyles.title, { color: Colors.author.primary, marginBottom: 0 }]}>Dashboard</Text>
                    <TouchableOpacity onPress={() => router.push('/')}>
                        <Text style={{ color: '#666' }}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                <View style={GlobalStyles.card}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>My Books</Text>

                    {loading ? (
                        <Text>Loading...</Text>
                    ) : error ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
                            <TouchableOpacity onPress={() => router.replace('/dashboard/author')}>
                                <Text style={{ color: Colors.author.primary }}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : books.length === 0 ? (
                        <View style={{ alignItems: 'center', padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
                            <Text style={{ color: '#666', marginBottom: 10 }}>No books yet</Text>
                            <TouchableOpacity
                                style={[GlobalStyles.button, { backgroundColor: Colors.author.primary, width: 'auto', paddingHorizontal: 20 }]}
                                onPress={() => router.push('/dashboard/author/create-book')}
                            >
                                <Text style={GlobalStyles.buttonText}>+ Create New Book</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {books.map((book) => (
                                <View key={book.id} style={{ padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{book.title}</Text>
                                        <Text style={{ color: '#666' }}>{book.genre}</Text>
                                    </View>
                                    <Text style={{ fontSize: 20 }}>{book.cover}</Text>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={[GlobalStyles.button, { backgroundColor: Colors.author.primary, marginTop: 10 }]}
                                onPress={() => router.push('/dashboard/author/create-book')}
                            >
                                <Text style={GlobalStyles.buttonText}>+ Add Another Book</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Quick Actions</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={[GlobalStyles.card, { flex: 1, alignItems: 'center' }]}
                            onPress={() => router.push('/dashboard/author/create-character')}
                        >
                            <Text style={{ fontSize: 24 }}>👤</Text>
                            <Text style={{ marginTop: 5, textAlign: 'center' }}>Create Character</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[GlobalStyles.card, { flex: 1, alignItems: 'center' }]}
                            onPress={async () => {
                                if (!auth.currentUser) return;
                                const result = await SeedService.seedDemoData(auth.currentUser.uid);
                                if (result.success) {
                                    alert("Demo book loaded! Pull to refresh or wait a moment.");
                                } else {
                                    alert("Failed to load demo data.");
                                }
                            }}
                        >
                            <Text style={{ fontSize: 24 }}>✨</Text>
                            <Text style={{ marginTop: 5, textAlign: 'center' }}>Load Demo Book</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
