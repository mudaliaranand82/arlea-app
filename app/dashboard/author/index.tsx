import { router } from 'expo-router';
import { deleteUser, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { auth, db } from '../../../firebaseConfig';

export default function AuthorDashboard() {
    const [books, setBooks] = useState<any[]>([]);
    const [characters, setCharacters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubBooks: () => void;
        let unsubChars: () => void;

        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                // Query 1: My Books
                const qBooks = query(collection(db, "books"), where("authorId", "==", user.uid));
                unsubBooks = onSnapshot(qBooks, (snap) => {
                    setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });

                // Query 2: All My Characters (for hierarchy)
                const qChars = query(collection(db, "characters"), where("authorId", "==", user.uid));
                unsubChars = onSnapshot(qChars, (snap) => {
                    setCharacters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        // Safety timeout omitted for brevity, standard loading state handles it
        return () => {
            unsubAuth();
            if (unsubBooks) unsubBooks();
            if (unsubChars) unsubChars();
        };
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/');
    };

    const handleResetProfile = () => {
        if (!auth.currentUser) return;

        // Use standard window.confirm for Web if available (Expo Web), otherwise Alert for Native
        if (typeof window !== 'undefined' && window.confirm) {
            const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone and will delete all your books and characters.");
            if (!confirmed) return;
            executeDelete();
            return;
        }

        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and will delete all your books and characters.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: executeDelete }
            ]
        );
    };

    const executeDelete = async () => {
        if (!auth.currentUser) return;
        try {
            const uid = auth.currentUser.uid;

            // 1. Delete Author's Books
            const booksQ = query(collection(db, "books"), where("authorId", "==", uid));
            const booksSnap = await getDocs(booksQ);
            const deleteBookPromises = booksSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteBookPromises);

            // 2. Delete Author's Characters
            const charsQ = query(collection(db, "characters"), where("authorId", "==", uid));
            const charsSnap = await getDocs(charsQ);
            const deleteCharPromises = charsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteCharPromises);

            // 3. Delete User Document
            await deleteDoc(doc(db, "users", uid));

            // 4. Delete Auth Account
            await deleteUser(auth.currentUser);

            router.replace('/');
            alert("Account and data deleted successfully.");
        } catch (e: any) {
            console.error("Delete Account Error:", e);
            if (e.code === 'auth/requires-recent-login') {
                alert("Please log out and log back in before deleting your account for security reasons.");
            } else {
                alert("Failed to delete account. Please try again.");
            }
        }
    };

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 }}>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.classic.primary }}>Dashboard</Text>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <TouchableOpacity onPress={handleResetProfile}>
                        <Text style={{ fontFamily: 'Outfit_500Medium', color: '#ef4444', fontSize: 12 }}>Reset Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={{ fontFamily: 'Outfit_500Medium', color: Colors.classic.textSecondary }}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu Tabs */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, borderBottomWidth: 1, borderBottomColor: Colors.classic.border }}>
                <View style={{ borderBottomWidth: 3, borderBottomColor: Colors.classic.primary, paddingBottom: 10, marginRight: 20 }}>
                    <Text style={{ fontFamily: 'Outfit_700Bold', color: Colors.classic.primary, fontSize: 16 }}>My Books</Text>
                </View>
                <View style={{ paddingBottom: 10 }}>
                    <Text style={{ fontFamily: 'Outfit_500Medium', color: Colors.classic.textSecondary, fontSize: 16, opacity: 0.5 }}>Analytics</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {loading ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.classic.textSecondary }}>Loading library...</Text>
                ) : books.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: Colors.classic.textSecondary, marginBottom: 20 }}>You haven't written any books yet.</Text>
                        <TouchableOpacity
                            style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary, paddingHorizontal: 30 }]}
                            onPress={() => router.push('/onboarding/author/book-info')}
                        >
                            <Text style={GlobalStyles.buttonText}>Start Your First Book</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ gap: 20 }}>
                        {books.map((book) => {
                            const bookChars = characters.filter(c => c.bookId === book.id);

                            return (
                                <View key={book.id} style={[GlobalStyles.card, { borderColor: Colors.classic.border, padding: 0, overflow: 'hidden' }]}>
                                    {/* Book Header */}
                                    <View style={{ backgroundColor: Colors.classic.secondary, padding: 15 }}>
                                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: Colors.classic.primary }}>{book.title}</Text>
                                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.classic.text }}>{book.genre || 'Uncategorized'} • {bookChars.length} Characters</Text>
                                    </View>

                                    {/* Character List */}
                                    <View style={{ padding: 15 }}>
                                        {bookChars.length > 0 ? (
                                            <View style={{ gap: 10 }}>
                                                {bookChars.map(char => (
                                                    <View key={char.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 }}>
                                                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.classic.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{char.name[0]}</Text>
                                                        </View>
                                                        <View>
                                                            <Text style={{ fontFamily: 'Outfit_600SemiBold', color: Colors.classic.text }}>{char.name}</Text>
                                                            <Text style={{ fontSize: 12, color: Colors.classic.textSecondary }}>{char.role}</Text>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <Text style={{ fontStyle: 'italic', color: '#999', fontSize: 12, marginBottom: 10 }}>No characters added yet.</Text>
                                        )}

                                        {/* Action: Add Character */}
                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}
                                            onPress={() => router.push({ pathname: '/onboarding/author/create-character', params: { bookId: book.id } })}
                                        >
                                            <Text style={{ color: Colors.classic.primary, fontWeight: 'bold' }}>+ Add Character</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Floating Action Button for New Book */}
            {!loading && books.length > 0 && (
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        right: 20,
                        backgroundColor: Colors.classic.primary,
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}
                    onPress={() => router.push('/onboarding/author/book-info')}
                >
                    <Text style={{ fontSize: 30, color: 'white', marginTop: -2 }}>+</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}
