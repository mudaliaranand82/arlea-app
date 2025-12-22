import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../../components/AnimatedCard';
import { TopNav } from '../../../components/TopNav';
import { DesignTokens } from '../../../constants/DesignSystem';
import { auth } from '../../../firebaseConfig';

export default function BookSelection() {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const books = [
        { id: 1, title: "The Secret Garden", author: "Frances Hodgson Burnett", emoji: "🌿" },
        { id: 2, title: "Treasure Island", author: "Robert Louis Stevenson", emoji: "🏴‍☠️" },
        { id: 3, title: "Alice in Wonderland", author: "Lewis Carroll", emoji: "🐰" },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TopNav showLogout onLogout={handleLogout} />

            <ScrollView
                contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, isDesktop && styles.titleDesktop]}>PICK A BOOK</Text>
                    <Text style={styles.subtitle}>Which world do you want to visit first?</Text>
                </View>

                <View style={[styles.booksGrid, isDesktop && styles.booksGridDesktop]}>
                    {books.map((book) => (
                        <AnimatedCard
                            key={book.id}
                            variant="light"
                            onPress={() => router.push('/onboarding/reader/tutorial')}
                            style={[styles.bookCard, isDesktop && styles.bookCardDesktop]}
                        >
                            <Text style={styles.bookEmoji}>{book.emoji}</Text>
                            <Text style={styles.bookTitle}>{book.title.toUpperCase()}</Text>
                            <Text style={styles.bookAuthor}>by {book.author}</Text>
                            <View style={styles.enterButton}>
                                <Text style={styles.enterButtonText}>ENTER →</Text>
                            </View>
                        </AnimatedCard>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    content: {
        padding: 24,
    },
    contentDesktop: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 28,
        color: DesignTokens.colors.primary,
        letterSpacing: 2,
        marginBottom: 12,
        textAlign: 'center',
    },
    titleDesktop: {
        fontSize: 40,
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: DesignTokens.colors.textLight,
        textAlign: 'center',
    },
    booksGrid: {
        gap: 20,
        width: '100%',
        maxWidth: 500,
    },
    booksGridDesktop: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: 900,
        justifyContent: 'center',
    },
    bookCard: {
        width: '100%',
    },
    bookCardDesktop: {
        width: 280,
        flex: undefined,
    },
    bookEmoji: {
        fontSize: 40,
        marginBottom: 16,
    },
    bookTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 16,
        color: DesignTokens.colors.text,
        letterSpacing: 1,
        marginBottom: 4,
    },
    bookAuthor: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: DesignTokens.colors.textLight,
        marginBottom: 16,
    },
    enterButton: {
        alignSelf: 'flex-start',
        backgroundColor: DesignTokens.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: DesignTokens.colors.border,
    },
    enterButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 11,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 1,
    },
});
