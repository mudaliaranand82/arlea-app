import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { arrayRemove, arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { TopNav } from '../../../components/TopNav';
import { DesignTokens } from '../../../constants/DesignSystem';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../firebaseConfig';

type FilterMode = 'all' | 'characters' | 'library';

export default function ReaderDashboard() {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const [books, setBooks] = useState<any[]>([]);
    const [characters, setCharacters] = useState<any[]>([]);
    const [savedBooks, setSavedBooks] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterMode>('all');

    useEffect(() => {
        if (!user) return;

        const booksQ = query(collection(db, "books"), where("status", "==", "published"));
        const unsubBooks = onSnapshot(booksQ, (snapshot) => {
            setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const charsQ = query(collection(db, "characters"));
        const unsubChars = onSnapshot(charsQ, (snapshot) => {
            setCharacters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const userDoc = doc(db, "users", user.uid);
        const unsubUser = onSnapshot(userDoc, (snapshot) => {
            const data = snapshot.data();
            setSavedBooks(data?.savedBooks || []);
        });

        return () => {
            unsubBooks();
            unsubChars();
            unsubUser();
        };
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/');
    };

    const toggleSaveBook = async (bookId: string) => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const isSaved = savedBooks.includes(bookId);
        await updateDoc(userRef, {
            savedBooks: isSaved ? arrayRemove(bookId) : arrayUnion(bookId)
        });
    };

    const getCharactersForBook = (bookId: string) => {
        return characters.filter(c => c.bookId === bookId);
    };

    const filteredBooks = books.filter(book => {
        const matchesSearch = search === '' ||
            book.title?.toLowerCase().includes(search.toLowerCase()) ||
            book.genre?.toLowerCase().includes(search.toLowerCase());

        if (filter === 'library') {
            return savedBooks.includes(book.id) && matchesSearch;
        }
        return matchesSearch;
    });

    const filteredCharacters = characters.filter(char => {
        const book = books.find(b => b.id === char.bookId);
        if (!book) return false;

        return search === '' ||
            char.name?.toLowerCase().includes(search.toLowerCase()) ||
            char.role?.toLowerCase().includes(search.toLowerCase());
    });

    const tabs: { key: FilterMode; label: string }[] = [
        { key: 'all', label: 'All Books' },
        { key: 'characters', label: 'Characters' },
        { key: 'library', label: 'Saved' }
    ];

    // Mode switch for TopNav
    const modeSwitchButton = (
        <AnimatedButton variant="outline" onPress={() => router.push('/dashboard/author')}>
            <Text style={styles.topNavButtonText}>AUTHOR</Text>
        </AnimatedButton>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* TopNav with mode switch next to logout */}
            <TopNav showLogout onLogout={handleLogout} rightContent={modeSwitchButton} />

            {/* Page Title */}
            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Explore</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search books or characters..."
                    placeholderTextColor="#999"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsContainer}
                contentContainerStyle={styles.tabsContent}
            >
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setFilter(tab.key)}
                        style={[styles.tab, filter === tab.key && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Content */}
            {filter === 'characters' ? (
                <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
                    {filteredCharacters.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {search ? 'No characters match your search.' : 'No characters available.'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.charactersGrid}>
                            {filteredCharacters.map(char => {
                                const book = books.find(b => b.id === char.bookId);
                                return (
                                    <TouchableOpacity
                                        key={char.id}
                                        style={styles.characterGridCard}
                                        onPress={() => router.push(`/reader/chat/${char.id}`)}
                                    >
                                        <View style={styles.characterGridAvatar}>
                                            <Text style={styles.characterGridAvatarText}>
                                                {char.name?.[0]}
                                            </Text>
                                        </View>
                                        <View style={styles.characterGridInfo}>
                                            <Text style={styles.characterGridName} numberOfLines={1}>
                                                {char.name}
                                            </Text>
                                            <Text style={styles.characterGridRole} numberOfLines={1}>
                                                {char.role}
                                            </Text>
                                            <Text style={styles.characterGridBook} numberOfLines={1}>
                                                {book?.title}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredBooks}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {filter === 'library'
                                    ? "You haven't saved any books yet.\nTap the bookmark to save!"
                                    : search
                                        ? 'No books match your search.'
                                        : 'No published books available.'}
                            </Text>
                        </View>
                    )}
                    renderItem={({ item: book }) => {
                        const bookChars = getCharactersForBook(book.id);
                        const isSaved = savedBooks.includes(book.id);
                        if (bookChars.length === 0) return null;

                        return (
                            <View style={styles.bookSection}>
                                {/* Book Header - HERO title with bookmark next to it */}
                                <View style={styles.bookHeader}>
                                    <Text style={styles.bookTitle}>{book.title}</Text>
                                    <TouchableOpacity onPress={() => toggleSaveBook(book.id)} style={styles.bookmarkBtn}>
                                        <Text style={[styles.bookmarkIcon, isSaved && styles.bookmarkIconActive]}>
                                            {isSaved ? '★' : '☆'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.bookGenre}>{book.genre}</Text>

                                {/* Characters - compact list */}
                                <View style={styles.charRow}>
                                    {bookChars.map(char => (
                                        <TouchableOpacity
                                            key={char.id}
                                            style={styles.charCard}
                                            onPress={() => router.push(`/reader/chat/${char.id}`)}
                                        >
                                            <View style={styles.charAvatar}>
                                                <Text style={styles.charAvatarText}>
                                                    {char.name?.[0]}
                                                </Text>
                                            </View>
                                            <Text style={styles.charName} numberOfLines={1}>
                                                {char.name}
                                            </Text>
                                            <Text style={styles.charRole} numberOfLines={1}>
                                                {char.role}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topNavButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
    pageHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pageTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 22,
        color: DesignTokens.colors.primary,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    tabsContainer: {
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
    },
    tabsContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        marginRight: 10,
    },
    tabActive: {
        backgroundColor: DesignTokens.colors.primary,
    },
    tabText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 12,
        color: '#666',
    },
    tabTextActive: {
        color: 'white',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    contentDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
    // Book Section - Clear separation
    bookSection: {
        marginBottom: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    bookHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    bookTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: DesignTokens.colors.primary,
    },
    bookmarkBtn: {
        padding: 4,
    },
    bookmarkIcon: {
        fontSize: 22,
        color: '#ccc',
    },
    bookmarkIconActive: {
        color: DesignTokens.colors.primary,
    },
    bookGenre: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#888',
        marginTop: 2,
        marginBottom: 14,
    },
    // Character Row - horizontal scroll
    charRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    charCard: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        width: 100,
        alignItems: 'center',
    },
    charAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    charAvatarText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 13,
        color: 'white',
    },
    charName: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    charRole: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
    },
    // Characters Grid (for Characters tab)
    charactersGrid: {
        gap: 12,
    },
    characterGridCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    characterGridAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    characterGridAvatarText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 16,
        color: 'white',
    },
    characterGridInfo: {
        flex: 1,
    },
    characterGridName: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 15,
        color: '#333',
    },
    characterGridRole: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        color: '#888',
    },
    characterGridBook: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 11,
        color: '#aaa',
        marginTop: 2,
    },
});
