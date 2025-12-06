import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../../firebaseConfig';

export default function ReaderDashboard() {
    const [recentBooks, setRecentBooks] = useState<any[]>([]);

    useEffect(() => {
        const fetchBooks = async () => {
            const q = query(collection(db, "books"), limit(5));
            const snapshot = await getDocs(q);
            const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentBooks(booksData);
        };
        fetchBooks();
    }, []);

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.reader.background }]}>
            <ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={[GlobalStyles.title, { color: Colors.reader.text, marginBottom: 0 }]}>My Library</Text>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <TouchableOpacity onPress={() => router.push('/dashboard/reader/library')}>
                            <Text style={{ color: Colors.reader.primary }}>See All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/')}>
                            <Text style={{ color: '#666' }}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginBottom: 30 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: Colors.reader.text }}>Continue Reading</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15 }}>
                        {recentBooks.map((book) => (
                            <TouchableOpacity
                                key={book.id}
                                style={[GlobalStyles.card, { width: 160, marginRight: 0 }]}
                                onPress={() => router.push(`/chat/${book.id}`)}
                            >
                                <View style={{ height: 100, backgroundColor: '#eee', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={{ fontSize: 40 }}>{book.cover}</Text>
                                </View>
                                <Text style={{ fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>{book.title}</Text>
                                <Text style={{ color: '#666', fontSize: 12 }}>{book.author}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: Colors.reader.text }}>Explore</Text>
                    <TouchableOpacity style={[GlobalStyles.card, { flexDirection: 'row', alignItems: 'center', gap: 15 }]}>
                        <View style={{ width: 50, height: 50, backgroundColor: Colors.reader.primary, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, color: 'white' }}>🔍</Text>
                        </View>
                        <View>
                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Find New Books</Text>
                            <Text style={{ color: '#666' }}>Browse the collection</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
