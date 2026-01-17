import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { arrayRemove, arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens } from '../../../constants/DesignSystem';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../firebaseConfig';

type FilterMode = 'all' | 'characters' | 'library';

// Animated Character Card
function CharacterCard({
    char,
    bookTitle,
    onPress,
    delay = 0,
}: {
    char: any;
    bookTitle?: string;
    onPress: () => void;
    delay?: number;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        >
            <Animated.View
                entering={FadeInUp.duration(400).delay(delay)}
                style={[styles.characterCard, animatedStyle]}
            >
                <View style={styles.characterAvatar}>
                    <Text style={styles.characterAvatarText}>
                        {char.name?.[0]?.toUpperCase()}
                    </Text>
                </View>
                <View style={styles.characterInfo}>
                    <Text style={styles.characterName} numberOfLines={1}>
                        {char.name}
                    </Text>
                    <Text style={styles.characterRole} numberOfLines={1}>
                        {char.role}
                    </Text>
                    {bookTitle && (
                        <Text style={styles.characterBook} numberOfLines={1}>
                            from {bookTitle}
                        </Text>
                    )}
                </View>
                <View style={styles.characterArrow}>
                    <Text style={styles.characterArrowText}>{'>'}</Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}

// Book Section Component
function BookSection({
    book,
    characters,
    isSaved,
    onToggleSave,
    delay = 0,
}: {
    book: any;
    characters: any[];
    isSaved: boolean;
    onToggleSave: () => void;
    delay?: number;
}) {
    return (
        <Animated.View
            entering={FadeIn.duration(500).delay(delay)}
            style={styles.bookSection}
        >
            {/* Book Header */}
            <View style={styles.bookHeader}>
                <View style={styles.bookTitleRow}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Pressable onPress={onToggleSave} style={styles.bookmarkBtn}>
                        <Text style={[styles.bookmarkIcon, isSaved && styles.bookmarkIconActive]}>
                            {isSaved ? '~' : '+'}
                        </Text>
                    </Pressable>
                </View>
                <View style={styles.bookMeta}>
                    <View style={styles.genreBadge}>
                        <Text style={styles.genreText}>{book.genre}</Text>
                    </View>
                    <Text style={styles.characterCount}>
                        {characters.length} character{characters.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* Characters List */}
            <View style={styles.bookCharacters}>
                {characters.map((char, index) => (
                    <Pressable
                        key={char.id}
                        style={styles.bookCharCard}
                        onPress={() => router.push(`/reader/chat/${char.id}`)}
                    >
                        <View style={styles.bookCharAvatar}>
                            <Text style={styles.bookCharAvatarText}>
                                {char.name?.[0]?.toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.bookCharInfo}>
                            <Text style={styles.bookCharName} numberOfLines={1}>
                                {char.name}
                            </Text>
                            <Text style={styles.bookCharRole} numberOfLines={1}>
                                {char.role}
                            </Text>
                        </View>
                        <Text style={styles.chatCta}>Chat</Text>
                    </Pressable>
                ))}
            </View>
        </Animated.View>
    );
}

export default function ReaderDashboard() {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const [books, setBooks] = useState<any[]>([]);
    const [characters, setCharacters] = useState<any[]>([]);
    const [savedBooks, setSavedBooks] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterMode>('all');
    const [searchFocused, setSearchFocused] = useState(false);

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
        { key: 'all', label: 'Discover' },
        { key: 'characters', label: 'Characters' },
        { key: 'library', label: 'My Library' }
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(500)}
                style={styles.header}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoAccent}>~</Text>
                        <Text style={styles.logo}>Arlea</Text>
                        <Text style={styles.logoAccent}>~</Text>
                    </View>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>Reader</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <Pressable
                        onPress={() => router.push('/dashboard/author')}
                        style={styles.switchModeBtn}
                    >
                        <Text style={styles.switchModeText}>Author Mode</Text>
                    </Pressable>
                    <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Page Title */}
            <Animated.View
                entering={FadeInUp.duration(500).delay(100)}
                style={styles.titleSection}
            >
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={[styles.pageTitle, isDesktop && styles.pageTitleDesktop]}>
                    Explore Stories
                </Text>
                <View style={styles.titleGoldLine} />
            </Animated.View>

            {/* Search Bar */}
            <Animated.View
                entering={FadeIn.duration(400).delay(200)}
                style={styles.searchContainer}
            >
                <View style={[styles.searchInputContainer, searchFocused && styles.searchInputFocused]}>
                    <Text style={styles.searchIcon}>~</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search books, characters, genres..."
                        placeholderTextColor={DesignTokens.colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                </View>
            </Animated.View>

            {/* Filter Tabs */}
            <Animated.View
                entering={FadeIn.duration(400).delay(300)}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsContainer}
                    contentContainerStyle={styles.tabsContent}
                >
                    {tabs.map(tab => (
                        <Pressable
                            key={tab.key}
                            onPress={() => setFilter(tab.key)}
                            style={[styles.tab, filter === tab.key && styles.tabActive]}
                        >
                            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* Content */}
            {filter === 'characters' ? (
                <ScrollView
                    contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredCharacters.length === 0 ? (
                        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
                            <Text style={styles.emptyOrnament}>"</Text>
                            <Text style={styles.emptyTitle}>
                                {search ? 'No matches found' : 'No characters yet'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {search
                                    ? 'Try a different search term'
                                    : 'Characters will appear here once authors publish their stories'}
                            </Text>
                        </Animated.View>
                    ) : (
                        <View style={styles.charactersList}>
                            {filteredCharacters.map((char, index) => {
                                const book = books.find(b => b.id === char.bookId);
                                return (
                                    <CharacterCard
                                        key={char.id}
                                        char={char}
                                        bookTitle={book?.title}
                                        onPress={() => router.push(`/reader/chat/${char.id}`)}
                                        delay={index * 50}
                                    />
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
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
                            <Text style={styles.emptyOrnament}>*</Text>
                            <Text style={styles.emptyTitle}>
                                {filter === 'library'
                                    ? 'Your library is empty'
                                    : search
                                        ? 'No matches found'
                                        : 'No stories yet'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {filter === 'library'
                                    ? 'Save books by tapping the + icon to build your collection'
                                    : search
                                        ? 'Try a different search term'
                                        : 'Published stories will appear here'}
                            </Text>
                        </Animated.View>
                    )}
                    renderItem={({ item: book, index }) => {
                        const bookChars = getCharactersForBook(book.id);
                        const isSaved = savedBooks.includes(book.id);
                        if (bookChars.length === 0) return null;

                        return (
                            <BookSection
                                book={book}
                                characters={bookChars}
                                isSaved={isSaved}
                                onToggleSave={() => toggleSaveBook(book.id)}
                                delay={index * 100}
                            />
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
        backgroundColor: DesignTokens.colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    logo: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 22,
        color: DesignTokens.colors.text,
    },
    logoAccent: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 18,
        color: DesignTokens.colors.accent,
    },
    roleBadge: {
        backgroundColor: DesignTokens.colors.accentLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: DesignTokens.radius.full,
    },
    roleBadgeText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 11,
        color: DesignTokens.colors.accent,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    switchModeBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: DesignTokens.radius.md,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
    },
    switchModeText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 12,
        color: DesignTokens.colors.textSecondary,
    },
    logoutBtn: {
        padding: 6,
    },
    logoutText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 12,
        color: DesignTokens.colors.textMuted,
    },

    // Title Section
    titleSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    welcomeText: {
        fontFamily: 'Lora-Italic',
        fontSize: 14,
        color: DesignTokens.colors.textMuted,
        marginBottom: 4,
    },
    pageTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 32,
        color: DesignTokens.colors.text,
        marginBottom: 12,
    },
    pageTitleDesktop: {
        fontSize: 40,
    },
    titleGoldLine: {
        width: 50,
        height: 2,
        backgroundColor: DesignTokens.colors.accent,
        borderRadius: 1,
    },

    // Search
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DesignTokens.colors.surface,
        borderRadius: DesignTokens.radius.lg,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        paddingHorizontal: 16,
        ...DesignTokens.shadows.subtle,
    },
    searchInputFocused: {
        borderColor: DesignTokens.colors.accent,
    },
    searchIcon: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 20,
        color: DesignTokens.colors.accent,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        fontFamily: 'Lora',
        color: DesignTokens.colors.text,
    },

    // Tabs
    tabsContainer: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    tabsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: DesignTokens.radius.full,
        backgroundColor: DesignTokens.colors.surface,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
    },
    tabActive: {
        backgroundColor: DesignTokens.colors.accent,
        borderColor: DesignTokens.colors.accent,
    },
    tabText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 13,
        color: DesignTokens.colors.textSecondary,
    },
    tabTextActive: {
        color: DesignTokens.colors.textOnAccent,
        fontFamily: 'Raleway-SemiBold',
    },

    // Content
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    contentDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 60,
        color: DesignTokens.colors.accent,
        opacity: 0.3,
        marginBottom: 8,
    },
    emptyTitle: {
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 20,
        color: DesignTokens.colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: 'Lora',
        fontSize: 14,
        color: DesignTokens.colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },

    // Book Section
    bookSection: {
        marginBottom: 32,
        backgroundColor: DesignTokens.colors.surface,
        borderRadius: DesignTokens.radius.xl,
        padding: 20,
        ...DesignTokens.shadows.soft,
    },
    bookHeader: {
        marginBottom: 16,
    },
    bookTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    bookTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 22,
        color: DesignTokens.colors.text,
        flex: 1,
    },
    bookmarkBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: DesignTokens.colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookmarkIcon: {
        fontFamily: 'PlayfairDisplay',
        fontSize: 18,
        color: DesignTokens.colors.textMuted,
    },
    bookmarkIconActive: {
        color: DesignTokens.colors.accent,
    },
    bookMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    genreBadge: {
        backgroundColor: DesignTokens.colors.accentLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: DesignTokens.radius.full,
    },
    genreText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 11,
        color: DesignTokens.colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    characterCount: {
        fontFamily: 'Lora',
        fontSize: 13,
        color: DesignTokens.colors.textMuted,
    },

    // Book Characters
    bookCharacters: {
        gap: 10,
    },
    bookCharCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DesignTokens.colors.backgroundAlt,
        padding: 14,
        borderRadius: DesignTokens.radius.lg,
    },
    bookCharAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    bookCharAvatarText: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 18,
        color: DesignTokens.colors.textOnDark,
    },
    bookCharInfo: {
        flex: 1,
    },
    bookCharName: {
        fontFamily: 'Lora-SemiBold',
        fontSize: 15,
        color: DesignTokens.colors.text,
    },
    bookCharRole: {
        fontFamily: 'Lora',
        fontSize: 13,
        color: DesignTokens.colors.textSecondary,
    },
    chatCta: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 12,
        color: DesignTokens.colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Characters List (for Characters tab)
    charactersList: {
        gap: 12,
    },
    characterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DesignTokens.colors.surface,
        padding: 16,
        borderRadius: DesignTokens.radius.lg,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        ...DesignTokens.shadows.subtle,
    },
    characterAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    characterAvatarText: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 20,
        color: DesignTokens.colors.textOnDark,
    },
    characterInfo: {
        flex: 1,
    },
    characterName: {
        fontFamily: 'Lora-SemiBold',
        fontSize: 16,
        color: DesignTokens.colors.text,
        marginBottom: 2,
    },
    characterRole: {
        fontFamily: 'Lora',
        fontSize: 14,
        color: DesignTokens.colors.textSecondary,
    },
    characterBook: {
        fontFamily: 'Lora-Italic',
        fontSize: 12,
        color: DesignTokens.colors.textMuted,
        marginTop: 4,
    },
    characterArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: DesignTokens.colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    characterArrowText: {
        fontFamily: 'Lora',
        fontSize: 16,
        color: DesignTokens.colors.accent,
    },
});
