import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { ClarityBadge, ClarityModal } from '../../../components/CharacterClarity';
import { EvalReportCard, EvalResult } from '../../../components/EvalReportCard';
import { DesignTokens } from '../../../constants/DesignSystem';
import { auth, db, functions } from '../../../firebaseConfig';

export default function AuthorDashboard() {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const [books, setBooks] = useState<any[]>([]);
    const [characters, setCharacters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const [showImportModal, setShowImportModal] = useState(false);
    const [importBookId, setImportBookId] = useState<string | null>(null);
    const [importJson, setImportJson] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<string | null>(null);

    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishBookId, setPublishBookId] = useState<string | null>(null);
    const [publishBookTitle, setPublishBookTitle] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const [showClarityModal, setShowClarityModal] = useState(false);
    const [clarityCharacter, setClarityCharacter] = useState<any>(null);

    const [showEvalModal, setShowEvalModal] = useState(false);
    const [evalCharacter, setEvalCharacter] = useState<any>(null);
    const [evalLoading, setEvalLoading] = useState(false);
    const [evalResult, setEvalResult] = useState<EvalResult | null>(null);

    useEffect(() => {
        let unsubBooks: () => void;
        let unsubChars: () => void;

        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const qBooks = query(collection(db, "books"), where("authorId", "==", user.uid));
                unsubBooks = onSnapshot(qBooks, (snap) => {
                    setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });

                const qChars = query(collection(db, "characters"), where("authorId", "==", user.uid));
                unsubChars = onSnapshot(qChars, (snap) => {
                    setCharacters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        return () => {
            unsubAuth();
            if (unsubBooks) unsubBooks();
            if (unsubChars) unsubChars();
        };
    }, []);

    const confirm = (message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            if (Platform.OS === 'web') {
                resolve(window.confirm(message));
            } else {
                Alert.alert("Confirm", message, [
                    { text: "Cancel", onPress: () => resolve(false) },
                    { text: "Delete", style: "destructive", onPress: () => resolve(true) }
                ]);
            }
        });
    };

    const showAlert = (title: string, message: string) => {
        Platform.OS === 'web' ? window.alert(`${title}: ${message}`) : Alert.alert(title, message);
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/');
    };

    const handleDeleteBook = async (bookId: string, title: string) => {
        if (!(await confirm(`Delete "${title}" and all its characters?`))) return;
        setDeleting(true);
        try {
            const bookChars = characters.filter(c => c.bookId === bookId);
            for (const char of bookChars) await deleteDoc(doc(db, "characters", char.id));
            await deleteDoc(doc(db, "books", bookId));
        } catch (e: any) {
            showAlert("Error", e.message);
        }
        setDeleting(false);
    };

    const handleDeleteAllCharacters = async (bookId: string, title: string) => {
        if (!(await confirm(`Delete all characters from "${title}"?`))) return;
        setDeleting(true);
        try {
            const bookChars = characters.filter(c => c.bookId === bookId);
            for (const char of bookChars) await deleteDoc(doc(db, "characters", char.id));
        } catch (e: any) {
            showAlert("Error", e.message);
        }
        setDeleting(false);
    };

    const openImportModal = (bookId: string) => {
        setImportBookId(bookId);
        setImportJson('');
        setImportResult(null);
        setShowImportModal(true);
    };

    const handleImport = async () => {
        if (!importBookId || !importJson.trim()) return;
        setImporting(true);
        try {
            const importCharacter = httpsCallable(functions, 'importCharacter');
            const parsed = JSON.parse(importJson);
            const chars = Array.isArray(parsed) ? parsed : [parsed];
            let successCount = 0;
            for (const char of chars) {
                await importCharacter({ bookId: importBookId, characterData: char });
                successCount++;
            }
            setImportResult(`Imported ${successCount} character(s) successfully`);
            setImportJson('');
        } catch (e: any) {
            setImportResult(`Error: ${e.message}`);
        }
        setImporting(false);
    };

    const openPublishModal = (bookId: string, title: string) => {
        const bookChars = characters.filter(c => c.bookId === bookId);

        if (bookChars.length === 0) {
            showAlert("Cannot Publish", "You need at least one character to publish this book.");
            return;
        }

        const unevaluatedChars = bookChars.filter(c => !c.evalStatus || c.evalStatus === 'pending');
        const failedChars = bookChars.filter(c => c.evalStatus === 'failed');
        const lowScoreChars = bookChars.filter(c => c.lastEvalScore && c.lastEvalScore < 28);

        if (unevaluatedChars.length > 0) {
            showAlert(
                "Evaluation Required",
                `${unevaluatedChars.length} character(s) haven't been evaluated yet. Run evaluation on all characters before publishing.`
            );
            return;
        }

        if (failedChars.length > 0 || lowScoreChars.length > 0) {
            const problematicChars = [...new Set([...failedChars, ...lowScoreChars])];
            showAlert(
                "Improve Characters",
                `${problematicChars.length} character(s) scored below 28. All characters need 28+ to publish.`
            );
            return;
        }

        setPublishBookId(bookId);
        setPublishBookTitle(title);
        setTermsAccepted(false);
        setPublishSuccess(false);
        setShowPublishModal(true);
    };

    const handlePublish = async () => {
        if (!publishBookId || !termsAccepted) return;
        setPublishing(true);
        try {
            await updateDoc(doc(db, "books", publishBookId), {
                status: "published",
                publishedAt: new Date(),
                termsAccepted: true
            });
            setPublishSuccess(true);
            setTimeout(() => {
                setShowPublishModal(false);
                setPublishSuccess(false);
            }, 2000);
        } catch (e: any) {
            showAlert("Error", e.message);
        }
        setPublishing(false);
    };

    const handleUnpublish = async (bookId: string) => {
        if (!(await confirm("Unpublish this book?"))) return;
        try {
            await updateDoc(doc(db, "books", bookId), { status: "draft" });
        } catch (e: any) {
            showAlert("Error", e.message);
        }
    };

    const openEvalModal = (character: any) => {
        setEvalCharacter(character);
        setEvalResult(null);
        setShowEvalModal(true);
    };

    const runEval = async () => {
        if (!evalCharacter) return;
        setEvalLoading(true);
        setEvalResult(null);

        try {
            const generateQuestions = httpsCallable(functions, 'generateEvalQuestions');
            const questionsResult = await generateQuestions({ characterId: evalCharacter.id });
            const questions = (questionsResult.data as any).questions;

            const runConversation = httpsCallable(functions, 'runEvalConversation');
            const conversationResult = await runConversation({
                characterId: evalCharacter.id,
                questions
            });
            const qaPairs = (conversationResult.data as any).qaPairs;

            const scoreResponses = httpsCallable(functions, 'scoreEvalResponses');
            const scoreResult = await scoreResponses({
                characterId: evalCharacter.id,
                qaPairs
            });

            setEvalResult(scoreResult.data as EvalResult);

            setCharacters(prev => prev.map(c =>
                c.id === evalCharacter.id
                    ? { ...c, evalStatus: (scoreResult.data as EvalResult).passed ? 'passed' : 'failed', lastEvalScore: (scoreResult.data as EvalResult).totalScore }
                    : c
            ));
        } catch (error: any) {
            showAlert("Evaluation Error", error.message || "Failed to run evaluation");
        }

        setEvalLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoAccent}>~</Text>
                        <Text style={styles.logo}>Arlea</Text>
                        <Text style={styles.logoAccent}>~</Text>
                    </View>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>Author</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <Pressable
                        onPress={() => router.push('/dashboard/reader')}
                        style={styles.switchModeBtn}
                    >
                        <Text style={styles.switchModeText}>Reader Mode</Text>
                    </Pressable>
                    <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Processing Overlay */}
            {deleting && (
                <View style={styles.overlay}>
                    <View style={styles.overlayBox}>
                        <Text style={styles.overlayOrnament}>~</Text>
                        <ActivityIndicator size="large" color={DesignTokens.colors.accent} />
                        <Text style={styles.overlayText}>Processing...</Text>
                    </View>
                </View>
            )}

            {/* Title Section */}
            <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.titleSection}>
                <Text style={styles.welcomeText}>Your creative space</Text>
                <Text style={[styles.pageTitle, isDesktop && styles.pageTitleDesktop]}>
                    Author Studio
                </Text>
                <View style={styles.titleGoldLine} />
            </Animated.View>

            <ScrollView
                contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingOrnament}>~</Text>
                        <ActivityIndicator size="large" color={DesignTokens.colors.accent} />
                        <Text style={styles.loadingText}>Loading your books...</Text>
                    </View>
                ) : books.length === 0 ? (
                    <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
                        <Text style={styles.emptyOrnament}>"</Text>
                        <Text style={styles.emptyTitle}>Begin Your First Story</Text>
                        <Text style={styles.emptyText}>
                            Create a book and bring your characters to life with AI-powered conversations.
                        </Text>
                        <AnimatedButton
                            variant="primary"
                            size="lg"
                            onPress={() => router.push('/onboarding/author/book-info')}
                            style={styles.emptyButton}
                        >
                            <Text style={styles.emptyButtonText}>Create Your First Book</Text>
                        </AnimatedButton>
                    </Animated.View>
                ) : (
                    <View style={styles.booksContainer}>
                        {books.map((book, index) => {
                            const bookChars = characters.filter(c => c.bookId === book.id);
                            const isDraft = book.status !== 'published';

                            return (
                                <Animated.View
                                    key={book.id}
                                    entering={FadeIn.duration(400).delay(index * 100)}
                                    style={styles.bookCard}
                                >
                                    {/* Book Header */}
                                    <View style={styles.bookHeader}>
                                        <View style={styles.bookTitleRow}>
                                            <Text style={styles.bookTitle}>{book.title}</Text>
                                            <View style={[styles.statusBadge, isDraft ? styles.statusDraft : styles.statusPublished]}>
                                                <Text style={[styles.statusText, isDraft ? styles.statusTextDraft : styles.statusTextPublished]}>
                                                    {isDraft ? 'Draft' : 'Published'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.bookMeta}>
                                            <View style={styles.genreBadge}>
                                                <Text style={styles.genreText}>{book.genre}</Text>
                                            </View>
                                            <Text style={styles.characterCount}>
                                                {bookChars.length} character{bookChars.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Characters */}
                                    <View style={styles.charactersSection}>
                                        {bookChars.length > 0 ? (
                                            <View style={styles.charactersList}>
                                                {bookChars.map(char => (
                                                    <View key={char.id} style={styles.characterItem}>
                                                        <View style={styles.characterAvatar}>
                                                            <Text style={styles.characterAvatarText}>
                                                                {char.name?.[0]?.toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.characterInfo}>
                                                            <Text style={styles.characterName}>{char.name}</Text>
                                                            <Text style={styles.characterRole}>{char.role}</Text>
                                                        </View>
                                                        <Pressable
                                                            onPress={() => openEvalModal(char)}
                                                            style={[
                                                                styles.evalButton,
                                                                char.evalStatus === 'passed' && styles.evalButtonPassed,
                                                                char.evalStatus === 'failed' && styles.evalButtonFailed,
                                                            ]}
                                                        >
                                                            <Text style={[
                                                                styles.evalButtonText,
                                                                char.evalStatus === 'passed' && styles.evalButtonTextPassed,
                                                                char.evalStatus === 'failed' && styles.evalButtonTextFailed,
                                                            ]}>
                                                                {char.evalStatus === 'passed' ? 'Passed' : char.evalStatus === 'failed' ? 'Failed' : 'Evaluate'}
                                                            </Text>
                                                        </Pressable>
                                                        <ClarityBadge
                                                            character={char}
                                                            onPress={() => {
                                                                setClarityCharacter(char);
                                                                setShowClarityModal(true);
                                                            }}
                                                        />
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <Text style={styles.noCharacters}>No characters yet. Add one to get started.</Text>
                                        )}

                                        {/* Actions */}
                                        <View style={styles.actionsRow}>
                                            <Pressable
                                                style={styles.actionButton}
                                                onPress={() => router.push({ pathname: '/onboarding/author/create-character', params: { bookId: book.id } })}
                                            >
                                                <Text style={styles.actionButtonText}>Add Character</Text>
                                            </Pressable>
                                            <Pressable
                                                style={styles.actionButton}
                                                onPress={() => openImportModal(book.id)}
                                            >
                                                <Text style={styles.actionButtonText}>Import</Text>
                                            </Pressable>
                                            {bookChars.length > 0 && (
                                                <Pressable
                                                    style={[styles.actionButton, styles.actionButtonDanger]}
                                                    onPress={() => handleDeleteAllCharacters(book.id, book.title)}
                                                >
                                                    <Text style={styles.actionButtonTextDanger}>Clear All</Text>
                                                </Pressable>
                                            )}
                                        </View>

                                        <View style={styles.bookActionsRow}>
                                            {isDraft ? (
                                                <Pressable
                                                    style={styles.publishButton}
                                                    onPress={() => openPublishModal(book.id, book.title)}
                                                >
                                                    <Text style={styles.publishButtonText}>Publish Book</Text>
                                                </Pressable>
                                            ) : (
                                                <Pressable
                                                    style={styles.unpublishButton}
                                                    onPress={() => handleUnpublish(book.id)}
                                                >
                                                    <Text style={styles.unpublishButtonText}>Unpublish</Text>
                                                </Pressable>
                                            )}
                                            <Pressable
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteBook(book.id, book.title)}
                                            >
                                                <Text style={styles.deleteButtonText}>Delete Book</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            {!loading && books.length > 0 && (
                <Pressable
                    style={styles.fab}
                    onPress={() => router.push('/onboarding/author/book-info')}
                >
                    <Text style={styles.fabText}>+</Text>
                </Pressable>
            )}

            {/* Import Modal */}
            <Modal visible={showImportModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Import Characters</Text>
                        <Text style={styles.modalDescription}>
                            Paste your character JSON below to import.
                        </Text>
                        <TextInput
                            style={styles.importInput}
                            placeholder="Paste JSON here..."
                            placeholderTextColor={DesignTokens.colors.textMuted}
                            value={importJson}
                            onChangeText={setImportJson}
                            multiline
                        />
                        {importResult && (
                            <View style={[
                                styles.importResult,
                                importResult.includes('success') ? styles.importSuccess : styles.importError
                            ]}>
                                <Text style={styles.importResultText}>{importResult}</Text>
                            </View>
                        )}
                        <View style={styles.modalActions}>
                            <Pressable style={styles.modalCancelBtn} onPress={() => setShowImportModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.modalPrimaryBtn} onPress={handleImport}>
                                {importing ? (
                                    <ActivityIndicator color={DesignTokens.colors.textOnAccent} size="small" />
                                ) : (
                                    <Text style={styles.modalPrimaryText}>Import</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Publish Modal */}
            <Modal visible={showPublishModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {publishSuccess ? (
                            <View style={styles.publishSuccess}>
                                <Text style={styles.publishSuccessOrnament}>~</Text>
                                <Text style={styles.publishSuccessTitle}>Published!</Text>
                                <Text style={styles.publishSuccessText}>
                                    Your book is now available to all readers.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Publish "{publishBookTitle}"</Text>
                                <Text style={styles.modalDescription}>
                                    Once published, all readers will be able to discover and chat with your characters.
                                </Text>

                                <Pressable style={styles.termsRow} onPress={() => setTermsAccepted(!termsAccepted)}>
                                    <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                                        {termsAccepted && <Text style={styles.checkmark}>~</Text>}
                                    </View>
                                    <Text style={styles.termsText}>
                                        I confirm that I have the rights to publish this content.
                                    </Text>
                                </Pressable>

                                <View style={styles.modalActions}>
                                    <Pressable style={styles.modalCancelBtn} onPress={() => setShowPublishModal(false)}>
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.modalPrimaryBtn, !termsAccepted && styles.modalPrimaryBtnDisabled]}
                                        onPress={handlePublish}
                                        disabled={!termsAccepted}
                                    >
                                        {publishing ? (
                                            <ActivityIndicator color={DesignTokens.colors.textOnAccent} size="small" />
                                        ) : (
                                            <Text style={styles.modalPrimaryText}>Publish</Text>
                                        )}
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <ClarityModal visible={showClarityModal} onClose={() => setShowClarityModal(false)} character={clarityCharacter} />

            {/* Eval Modal */}
            <Modal visible={showEvalModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 500, maxHeight: '80%' }]}>
                        <View style={styles.evalModalHeader}>
                            <Text style={styles.modalTitle}>
                                Evaluate: {evalCharacter?.name}
                            </Text>
                            <Pressable onPress={() => setShowEvalModal(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>x</Text>
                            </Pressable>
                        </View>
                        <ScrollView style={{ flex: 1 }}>
                            <EvalReportCard
                                evalResult={evalResult}
                                loading={evalLoading}
                                onRunEval={runEval}
                                onPublish={() => {
                                    setShowEvalModal(false);
                                }}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: DesignTokens.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: DesignTokens.radius.full,
    },
    roleBadgeText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 11,
        color: DesignTokens.colors.textOnDark,
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

    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: DesignTokens.colors.overlay,
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayBox: {
        backgroundColor: DesignTokens.colors.surface,
        padding: 32,
        borderRadius: DesignTokens.radius.xl,
        alignItems: 'center',
        ...DesignTokens.shadows.dramatic,
    },
    overlayOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 32,
        color: DesignTokens.colors.accent,
        marginBottom: 12,
    },
    overlayText: {
        fontFamily: 'Lora',
        marginTop: 12,
        color: DesignTokens.colors.textSecondary,
    },

    // Title Section
    titleSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
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

    // Content
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    contentDesktop: {
        maxWidth: 700,
        alignSelf: 'center',
        width: '100%',
    },

    // Loading
    loadingContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    loadingOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 40,
        color: DesignTokens.colors.accent,
        marginBottom: 16,
    },
    loadingText: {
        fontFamily: 'Lora-Italic',
        fontSize: 15,
        color: DesignTokens.colors.textMuted,
        marginTop: 16,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    emptyOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 80,
        color: DesignTokens.colors.accent,
        opacity: 0.2,
        marginBottom: 8,
    },
    emptyTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 26,
        color: DesignTokens.colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyText: {
        fontFamily: 'Lora',
        fontSize: 15,
        color: DesignTokens.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
        marginBottom: 28,
    },
    emptyButton: {},
    emptyButtonText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 14,
        color: DesignTokens.colors.textOnAccent,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Books
    booksContainer: {
        gap: 24,
    },
    bookCard: {
        backgroundColor: DesignTokens.colors.surface,
        borderRadius: DesignTokens.radius.xl,
        overflow: 'hidden',
        ...DesignTokens.shadows.soft,
    },
    bookHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: DesignTokens.colors.divider,
    },
    bookTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    bookTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 20,
        color: DesignTokens.colors.text,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: DesignTokens.radius.full,
    },
    statusDraft: {
        backgroundColor: DesignTokens.colors.accentLight,
    },
    statusPublished: {
        backgroundColor: 'rgba(74, 124, 89, 0.15)',
    },
    statusText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statusTextDraft: {
        color: DesignTokens.colors.accent,
    },
    statusTextPublished: {
        color: DesignTokens.colors.success,
    },
    bookMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    genreBadge: {
        backgroundColor: DesignTokens.colors.backgroundAlt,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: DesignTokens.radius.full,
    },
    genreText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 11,
        color: DesignTokens.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    characterCount: {
        fontFamily: 'Lora',
        fontSize: 13,
        color: DesignTokens.colors.textMuted,
    },

    // Characters Section
    charactersSection: {
        padding: 20,
    },
    charactersList: {
        gap: 10,
    },
    characterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DesignTokens.colors.backgroundAlt,
        padding: 14,
        borderRadius: DesignTokens.radius.lg,
    },
    characterAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    characterAvatarText: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 16,
        color: DesignTokens.colors.textOnDark,
    },
    characterInfo: {
        flex: 1,
    },
    characterName: {
        fontFamily: 'Lora-SemiBold',
        fontSize: 15,
        color: DesignTokens.colors.text,
    },
    characterRole: {
        fontFamily: 'Lora',
        fontSize: 12,
        color: DesignTokens.colors.textSecondary,
    },
    noCharacters: {
        fontFamily: 'Lora-Italic',
        fontSize: 14,
        color: DesignTokens.colors.textMuted,
        textAlign: 'center',
        paddingVertical: 20,
    },

    // Eval Button
    evalButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: DesignTokens.radius.md,
        backgroundColor: DesignTokens.colors.border,
        marginRight: 10,
    },
    evalButtonPassed: {
        backgroundColor: 'rgba(74, 124, 89, 0.15)',
    },
    evalButtonFailed: {
        backgroundColor: 'rgba(165, 74, 74, 0.15)',
    },
    evalButtonText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 11,
        color: DesignTokens.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    evalButtonTextPassed: {
        color: DesignTokens.colors.success,
    },
    evalButtonTextFailed: {
        color: DesignTokens.colors.error,
    },

    // Actions
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: DesignTokens.colors.divider,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: DesignTokens.radius.md,
        backgroundColor: DesignTokens.colors.backgroundAlt,
    },
    actionButtonDanger: {
        backgroundColor: 'rgba(165, 74, 74, 0.1)',
    },
    actionButtonText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 12,
        color: DesignTokens.colors.text,
    },
    actionButtonTextDanger: {
        fontFamily: 'Raleway-Medium',
        fontSize: 12,
        color: DesignTokens.colors.error,
    },
    bookActionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    publishButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: DesignTokens.colors.accent,
        borderRadius: DesignTokens.radius.md,
        alignItems: 'center',
    },
    publishButtonText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 13,
        color: DesignTokens.colors.textOnAccent,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    unpublishButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: DesignTokens.colors.backgroundAlt,
        borderRadius: DesignTokens.radius.md,
        alignItems: 'center',
    },
    unpublishButtonText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 13,
        color: DesignTokens.colors.textSecondary,
    },
    deleteButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: DesignTokens.radius.md,
        borderWidth: 1,
        borderColor: DesignTokens.colors.error,
    },
    deleteButtonText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 13,
        color: DesignTokens.colors.error,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: DesignTokens.colors.accent,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...DesignTokens.shadows.glow,
    },
    fabText: {
        fontFamily: 'PlayfairDisplay',
        fontSize: 32,
        color: DesignTokens.colors.textOnAccent,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DesignTokens.colors.overlay,
        padding: 20,
    },
    modalContent: {
        backgroundColor: DesignTokens.colors.surface,
        borderRadius: DesignTokens.radius.xl,
        padding: 28,
        width: '100%',
        maxWidth: 420,
        ...DesignTokens.shadows.dramatic,
    },
    modalTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 22,
        color: DesignTokens.colors.text,
        marginBottom: 8,
    },
    modalDescription: {
        fontFamily: 'Lora',
        fontSize: 14,
        color: DesignTokens.colors.textSecondary,
        lineHeight: 22,
        marginBottom: 20,
    },
    importInput: {
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        borderRadius: DesignTokens.radius.md,
        padding: 14,
        minHeight: 120,
        fontFamily: 'SpaceMono',
        fontSize: 12,
        color: DesignTokens.colors.text,
        backgroundColor: DesignTokens.colors.backgroundAlt,
        textAlignVertical: 'top',
    },
    importResult: {
        marginTop: 12,
        padding: 12,
        borderRadius: DesignTokens.radius.md,
    },
    importSuccess: {
        backgroundColor: 'rgba(74, 124, 89, 0.15)',
    },
    importError: {
        backgroundColor: 'rgba(165, 74, 74, 0.1)',
    },
    importResultText: {
        fontFamily: 'Lora',
        fontSize: 13,
        textAlign: 'center',
        color: DesignTokens.colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    modalCancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    modalCancelText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 14,
        color: DesignTokens.colors.textMuted,
    },
    modalPrimaryBtn: {
        backgroundColor: DesignTokens.colors.accent,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: DesignTokens.radius.md,
    },
    modalPrimaryBtnDisabled: {
        backgroundColor: DesignTokens.colors.border,
    },
    modalPrimaryText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 14,
        color: DesignTokens.colors.textOnAccent,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Publish Success
    publishSuccess: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    publishSuccessOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 48,
        color: DesignTokens.colors.accent,
        marginBottom: 16,
    },
    publishSuccessTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 26,
        color: DesignTokens.colors.text,
        marginBottom: 8,
    },
    publishSuccessText: {
        fontFamily: 'Lora',
        fontSize: 15,
        color: DesignTokens.colors.textSecondary,
        textAlign: 'center',
    },

    // Terms
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        padding: 16,
        backgroundColor: DesignTokens.colors.backgroundAlt,
        borderRadius: DesignTokens.radius.lg,
        marginBottom: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: DesignTokens.colors.border,
        borderRadius: DesignTokens.radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: DesignTokens.colors.accent,
        borderColor: DesignTokens.colors.accent,
    },
    checkmark: {
        fontFamily: 'PlayfairDisplay-Italic',
        color: DesignTokens.colors.textOnAccent,
        fontSize: 16,
    },
    termsText: {
        flex: 1,
        fontFamily: 'Lora',
        fontSize: 14,
        color: DesignTokens.colors.textSecondary,
        lineHeight: 20,
    },

    // Eval Modal
    evalModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: DesignTokens.colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontFamily: 'Lora',
        fontSize: 18,
        color: DesignTokens.colors.textMuted,
    },
});
