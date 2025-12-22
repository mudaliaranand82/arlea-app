import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { TopNav } from '../../../components/TopNav';
import { DesignTokens } from '../../../constants/DesignSystem';
import { useAuth } from '../../../context/AuthContext';
import { auth, db, functions } from '../../../firebaseConfig';

const GENRES = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Thriller", "Horror", "Historical Fiction", "Non-Fiction", "Other"];

export default function BookInfo() {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [bookContent, setBookContent] = useState('');
    const [showGenreModal, setShowGenreModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [processingContent, setProcessingContent] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');

    const showAlert = (alertTitle: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${alertTitle}: ${message}`);
        } else {
            Alert.alert(alertTitle, message);
        }
    };

    const handleNext = async () => {
        if (!title || !genre) {
            showAlert("Missing Info", "Please enter a title and select a genre.");
            return;
        }

        if (!user) {
            showAlert("Error", "You must be logged in.");
            return;
        }

        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, "books"), {
                title,
                genre,
                authorId: user.uid,
                createdAt: new Date(),
                cover: "📚",
                hasContent: bookContent.length >= 100,
                status: "draft"
            });

            if (bookContent.length >= 100) {
                setProcessingContent(true);
                setProcessingStatus("Processing your book content...");

                try {
                    const processBookContent = httpsCallable(functions, 'processBookContent');
                    setProcessingStatus("Chunking and creating embeddings...");

                    const result = await processBookContent({
                        bookId: docRef.id,
                        content: bookContent
                    });

                    const data = result.data as any;
                    setProcessingStatus(`Indexed ${data.chunksProcessed} passages!`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (contentError: any) {
                    showAlert("Content Processing", "Book created, but content indexing failed. You can add content later.");
                }
            }

            router.push({ pathname: '/onboarding/author/create-character', params: { bookId: docRef.id } });
        } catch (e: any) {
            showAlert("Error", "Failed to save book: " + e.message);
        } finally {
            setLoading(false);
            setProcessingContent(false);
            setProcessingStatus('');
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

    const wordCount = bookContent.split(/\s+/).filter(Boolean).length;
    const charCount = bookContent.length;

    return (
        <SafeAreaView style={styles.container}>
            <TopNav showLogout onLogout={handleLogout} />

            <ScrollView
                contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, isDesktop && styles.titleDesktop]}>TELL US ABOUT YOUR BOOK</Text>
                    <Text style={styles.subtitle}>This information helps us set up your world.</Text>
                </View>

                {/* Basic Info Card */}
                <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                    <Text style={styles.label}>BOOK TITLE</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. The Hobbit"
                        placeholderTextColor={DesignTokens.colors.textLight}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>GENRE</Text>
                    <AnimatedButton
                        variant="outline"
                        onPress={() => setShowGenreModal(true)}
                        style={styles.genreButton}
                    >
                        <Text style={genre ? styles.genreTextSelected : styles.genreTextPlaceholder}>
                            {genre || "SELECT A GENRE"}
                        </Text>
                        <Text style={styles.genreArrow}>▼</Text>
                    </AnimatedButton>
                </View>

                {/* Book Content Card */}
                <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                    <View style={styles.contentHeader}>
                        <Text style={styles.label}>BOOK CONTENT</Text>
                        <Text style={styles.wordCount}>
                            {wordCount} words • {charCount.toLocaleString()} chars
                        </Text>
                    </View>
                    <Text style={styles.contentHint}>
                        Paste your book text here. This allows characters to reference actual content.
                    </Text>
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Paste your book content here... (at least 100 characters)"
                        placeholderTextColor={DesignTokens.colors.textLight}
                        value={bookContent}
                        onChangeText={setBookContent}
                        multiline
                        numberOfLines={10}
                    />
                    {bookContent.length > 0 && bookContent.length < 100 && (
                        <Text style={styles.contentError}>
                            Content must be at least 100 characters ({100 - bookContent.length} more needed)
                        </Text>
                    )}
                    {bookContent.length >= 100 && (
                        <Text style={styles.contentSuccess}>✓ Content ready for indexing</Text>
                    )}
                </View>

                {bookContent.length < 100 && (
                    <Text style={styles.skipNote}>
                        You can skip book content for now and add it later from the dashboard.
                    </Text>
                )}

                {/* Processing Status */}
                {processingContent && (
                    <View style={styles.processingBox}>
                        <ActivityIndicator size="small" color={DesignTokens.colors.primary} />
                        <Text style={styles.processingText}>{processingStatus}</Text>
                    </View>
                )}

                {/* CTA */}
                <AnimatedButton
                    variant="primary"
                    onPress={handleNext}
                    style={styles.ctaButton}
                >
                    <Text style={styles.ctaButtonText}>
                        {loading || processingContent ? "PROCESSING..." : "CREATE BOOK & CONTINUE"}
                    </Text>
                    <Text style={styles.ctaButtonArrow}>→</Text>
                </AnimatedButton>

                {/* Genre Modal */}
                <Modal visible={showGenreModal} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>SELECT GENRE</Text>
                            <ScrollView>
                                {GENRES.map(g => (
                                    <AnimatedButton
                                        key={g}
                                        variant="outline"
                                        onPress={() => {
                                            setGenre(g);
                                            setShowGenreModal(false);
                                        }}
                                        style={styles.genreOption}
                                    >
                                        <Text style={styles.genreOptionText}>{g.toUpperCase()}</Text>
                                    </AnimatedButton>
                                ))}
                            </ScrollView>
                            <AnimatedButton
                                variant="secondary"
                                onPress={() => setShowGenreModal(false)}
                                style={styles.modalCancel}
                            >
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </AnimatedButton>
                        </View>
                    </View>
                </Modal>
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
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: DesignTokens.colors.primary,
        letterSpacing: 1,
        marginBottom: 8,
        textAlign: 'center',
    },
    titleDesktop: {
        fontSize: 36,
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
        textAlign: 'center',
    },
    card: {
        backgroundColor: DesignTokens.colors.background,
        borderWidth: DesignTokens.borders.thick,
        borderColor: DesignTokens.colors.border,
        padding: DesignTokens.spacing.lg,
        marginBottom: 20,
        width: '100%',
        maxWidth: 500,
        shadowColor: DesignTokens.colors.border,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
    },
    cardDesktop: {},
    label: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 11,
        color: DesignTokens.colors.text,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderWidth: DesignTokens.borders.regular,
        borderColor: DesignTokens.colors.border,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: DesignTokens.colors.text,
        marginBottom: 20,
    },
    genreButton: {
        marginBottom: 0,
    },
    genreTextSelected: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
    genreTextPlaceholder: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        letterSpacing: 0.5,
    },
    genreArrow: {
        fontSize: 10,
        color: DesignTokens.colors.textLight,
    },
    contentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    wordCount: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 11,
        color: DesignTokens.colors.textLight,
    },
    contentHint: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        marginBottom: 12,
    },
    contentInput: {
        backgroundColor: '#F5F5F5',
        borderWidth: DesignTokens.borders.regular,
        borderColor: DesignTokens.colors.border,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: DesignTokens.colors.text,
        minHeight: 150,
        maxHeight: 300,
        textAlignVertical: 'top',
    },
    contentError: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 11,
        color: '#ef4444',
        marginTop: 8,
    },
    contentSuccess: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 11,
        color: '#22c55e',
        marginTop: 8,
    },
    skipNote: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        textAlign: 'center',
        marginBottom: 16,
    },
    processingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: DesignTokens.colors.background,
        borderWidth: DesignTokens.borders.regular,
        borderColor: DesignTokens.colors.primary,
        marginBottom: 16,
        maxWidth: 500,
        width: '100%',
    },
    processingText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 12,
        color: DesignTokens.colors.primary,
        marginLeft: 12,
        letterSpacing: 0.5,
    },
    ctaButton: {
        width: '100%',
        maxWidth: 500,
    },
    ctaButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 0.5,
    },
    ctaButtonArrow: {
        fontSize: 18,
        color: DesignTokens.colors.textOnPrimary,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DesignTokens.colors.modalOverlay,
    },
    modalContent: {
        backgroundColor: DesignTokens.colors.background,
        borderWidth: DesignTokens.borders.thick,
        borderColor: DesignTokens.colors.border,
        padding: 24,
        width: '90%',
        maxWidth: 320,
        maxHeight: '70%',
        // Hard offset shadow
        shadowColor: DesignTokens.colors.border,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 12,
    },
    modalTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 20,
    },
    genreOption: {
        marginBottom: 8,
    },
    genreOptionText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
    },
    modalCancel: {
        marginTop: 16,
    },
    modalCancelText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        letterSpacing: 0.5,
    },
});
