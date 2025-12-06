import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

import { collection, getDocs } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../../../firebaseConfig';

export default function Library() {
    const [books, setBooks] = useState<any[]>([]);

    useEffect(() => {
        const fetchBooks = async () => {
            const snapshot = await getDocs(collection(db, "books"));
            const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBooks(booksData);
        };
        fetchBooks();
    }, []);

    const handleRemove = (id: string) => {
        Alert.alert(
            "Remove Book",
            "Are you sure you want to remove this book from your library?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => setBooks(prev => prev.filter(b => b.id !== id))
                }
            ]
        );
    };

    const screenWidth = Dimensions.get('window').width;
    const itemWidth = (screenWidth - 45) / 2; // 2 columns with padding

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.reader.background }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                    <Text style={{ fontSize: 24 }}>←</Text>
                </TouchableOpacity>
                <Text style={[GlobalStyles.title, { color: Colors.reader.text, marginBottom: 0 }]}>My Library</Text>
            </View>

            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
                {books.map((book) => (
                    <TouchableOpacity
                        key={book.id}
                        style={[GlobalStyles.card, { width: itemWidth, marginRight: 0 }]}
                        onPress={() => router.push(`/chat/${book.id}`)}
                        onLongPress={() => handleRemove(book.id)}
                    >
                        <View style={{ height: 120, backgroundColor: '#eee', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontSize: 50 }}>{book.cover}</Text>
                        </View>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>{book.title}</Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>{book.author}</Text>
                    </TouchableOpacity>
                ))}

                {books.length === 0 && (
                    <View style={{ width: '100%', alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: '#666', fontSize: 16 }}>Your library is empty.</Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={{ color: Colors.reader.primary, marginTop: 10 }}>Find new books</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
