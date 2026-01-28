import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { ClarityBadge, ClarityModal } from '../../../components/CharacterClarity';
import { EvalReportCard, EvalResult } from '../../../components/EvalReportCard';
import { TopNav } from '../../../components/TopNav';
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

    // Eval modal state
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

    const handleDeleteAllBooks = async () => {
        if (!auth.currentUser) return;
        if (!(await confirm(`Delete ALL ${books.length} books?`))) return;
        setDeleting(true);
        try {
            for (const char of characters) await deleteDoc(doc(db, "characters", char.id));
            for (const book of books) await deleteDoc(doc(db, "books", book.id));
        } catch (e: any) {
            showAlert("Error", e.message);
        }
        setDeleting(false);
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
            setImportResult(`✅ Imported ${successCount} character(s)`);
            setImportJson('');
        } catch (e: any) {
            setImportResult(`❌ Error: ${e.message}`);
        }
        setImporting(false);
    };

    const openPublishModal = async (bookId: string, title: string) => {
        // Check if all characters have passed eval
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
                "Eval Required",
                `${unevaluatedChars.length} character(s) haven't been evaluated yet:\n\n${unevaluatedChars.map(c => `• ${c.name}`).join('\n')}\n\nRun eval on all characters before publishing.`
            );
            return;
        }

        if (failedChars.length > 0 || lowScoreChars.length > 0) {
            const problematicChars = [...new Set([...failedChars, ...lowScoreChars])];
            showAlert(
                "Improve Characters",
                `${problematicChars.length} character(s) scored below 28:\n\n${problematicChars.map(c => `• ${c.name} (${c.lastEvalScore || 'N/A'}/35)`).join('\n')}\n\nAll characters need 28+ to publish.`
            );
            return;
        }

        // Phase 2: Governance Gate - Check regression status (Warning only)
        const failedRegressionChars = bookChars.filter(c => c.regressionStatus === 'failed');
        if (failedRegressionChars.length > 0) {
            // Show warning but allow to proceed (soft gate)
            const proceed = await new Promise<boolean>((resolve) => {
                if (Platform.OS === 'web') {
                    resolve(window.confirm(
                        `⚠️ Regression Warning\n\n${failedRegressionChars.length} character(s) failed regression testing:\n${failedRegressionChars.map(c => `• ${c.name}`).join('\n')}\n\nThis means their behavior may have drifted from the Golden baseline. Publish anyway?`
                    ));
                } else {
                    Alert.alert(
                        "⚠️ Regression Warning",
                        `${failedRegressionChars.length} character(s) failed regression testing. Their behavior may have drifted. Publish anyway?`,
                        [
                            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
                            { text: "Publish Anyway", onPress: () => resolve(true) }
                        ]
                    );
                }
            });
            if (!proceed) return;
        }

        // All checks passed - open publish modal
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

    // Eval functions
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
            // Step 1: Generate questions
            const generateQuestions = httpsCallable(functions, 'generateEvalQuestions');
            const questionsResult = await generateQuestions({ characterId: evalCharacter.id });
            const questions = (questionsResult.data as any).questions;

            // Step 2: Run conversation
            const runConversation = httpsCallable(functions, 'runEvalConversation');
            const conversationResult = await runConversation({
                characterId: evalCharacter.id,
                questions
            });
            const qaPairs = (conversationResult.data as any).qaPairs;

            // Step 3: Score responses
            const scoreResponses = httpsCallable(functions, 'scoreEvalResponses');
            const scoreResult = await scoreResponses({
                characterId: evalCharacter.id,
                qaPairs
            });

            setEvalResult(scoreResult.data as EvalResult);

            // Update local character state with eval status
            setCharacters(prev => prev.map(c =>
                c.id === evalCharacter.id
                    ? { ...c, evalStatus: (scoreResult.data as EvalResult).passed ? 'passed' : 'failed', lastEvalScore: (scoreResult.data as EvalResult).totalScore }
                    : c
            ));
        } catch (error: any) {
            showAlert("Eval Error", error.message || "Failed to run evaluation");
        }

        setEvalLoading(false);
    };

    // Mode switch button for TopNav
    const modeSwitchButton = (
        <AnimatedButton variant="outline" onPress={() => router.push('/dashboard/reader')}>
            <Text style={styles.topNavButtonText}>READER</Text>
        </AnimatedButton>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* TopNav with mode switch next to logout */}
            <TopNav showLogout onLogout={handleLogout} rightContent={modeSwitchButton} />

            {/* Page Title */}
            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Author Dashboard</Text>
                <TouchableOpacity
                    style={{ padding: 8, backgroundColor: '#f0f9ff', borderRadius: 8 }}
                    onPress={() => router.push('/admin/review-board' as any)}
                >
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', color: '#0369a1', fontSize: 13 }}>
                        🔬 GOV. BOARD
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Deleting Overlay */}
            {deleting && (
                <View style={styles.overlay}>
                    <View style={styles.overlayBox}>
                        <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
                        <Text style={styles.overlayText}>Processing...</Text>
                    </View>
                </View>
            )}

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
                    </View>
                ) : books.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>You haven't created any books yet.</Text>
                        <AnimatedButton variant="primary" onPress={() => router.push('/onboarding/author/book-info')}>
                            <Text style={styles.emptyButtonText}>CREATE YOUR FIRST BOOK</Text>
                            <Text style={styles.emptyButtonArrow}>→</Text>
                        </AnimatedButton>
                    </View>
                ) : (
                    <View style={styles.booksContainer}>
                        {books.map((book) => {
                            const bookChars = characters.filter(c => c.bookId === book.id);
                            const isDraft = book.status !== 'published';

                            return (
                                <View key={book.id} style={styles.bookCard}>
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
                                        <Text style={styles.bookMeta}>{book.genre} • {bookChars.length} Characters</Text>
                                    </View>

                                    {/* Characters */}
                                    <View style={styles.charactersSection}>
                                        {bookChars.length > 0 ? (
                                            <View style={styles.charactersList}>
                                                {bookChars.map(char => (
                                                    <View key={char.id} style={styles.characterItem}>
                                                        <View style={styles.characterAvatar}>
                                                            <Text style={styles.characterAvatarText}>{char.name?.[0]}</Text>
                                                        </View>
                                                        <View style={styles.characterInfo}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                <Text style={styles.characterName}>{char.name}</Text>
                                                                {/* Certification State Badge */}
                                                                {char.certificationState === 'certified' && (
                                                                    <View style={[styles.certBadge, styles.certBadgeCertified]}>
                                                                        <Text style={styles.certBadgeText}>✓ CERTIFIED</Text>
                                                                    </View>
                                                                )}
                                                                {char.certificationState === 'evaluated' && (
                                                                    <View style={[styles.certBadge, styles.certBadgeEvaluated]}>
                                                                        <Text style={styles.certBadgeText}>EVALUATED</Text>
                                                                    </View>
                                                                )}
                                                                {char.certificationState === 'monitored' && (
                                                                    <View style={[styles.certBadge, styles.certBadgeMonitored]}>
                                                                        <Text style={styles.certBadgeText}>⚠ MONITORED</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            <Text style={styles.characterRole}>{char.role}</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => openEvalModal(char)}
                                                            style={styles.evalButton}
                                                        >
                                                            <Text style={styles.evalButtonText}>
                                                                {char.evalStatus === 'passed' ? '✓ Eval' : char.evalStatus === 'failed' ? '✗ Eval' : 'Eval'}
                                                            </Text>
                                                        </TouchableOpacity>
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
                                            <Text style={styles.noCharacters}>No characters yet</Text>
                                        )}

                                        {/* Actions */}
                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity onPress={() => router.push({ pathname: '/onboarding/author/create-character', params: { bookId: book.id } })}>
                                                <Text style={styles.actionLink}>+ Add Character</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openImportModal(book.id)}>
                                                <Text style={[styles.actionLink, { color: '#6366f1' }]}>Import</Text>
                                            </TouchableOpacity>
                                            {bookChars.length > 0 && (
                                                <TouchableOpacity onPress={() => handleDeleteAllCharacters(book.id, book.title)}>
                                                    <Text style={[styles.actionLink, { color: '#ef4444' }]}>Clear All</Text>
                                                </TouchableOpacity>
                                            )}
                                            {isDraft ? (
                                                <TouchableOpacity onPress={() => openPublishModal(book.id, book.title)}>
                                                    <Text style={[styles.actionLink, { color: '#22c55e' }]}>🚀 Publish</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity onPress={() => handleUnpublish(book.id)}>
                                                    <Text style={[styles.actionLink, { color: '#f59e0b' }]}>Unpublish</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity onPress={() => handleDeleteBook(book.id, book.title)}>
                                                <Text style={[styles.actionLink, { color: '#ef4444' }]}>Delete Book</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Import Modal */}
            <Modal visible={showImportModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Import Characters</Text>
                        <TextInput
                            style={styles.importInput}
                            placeholder="Paste JSON here..."
                            placeholderTextColor="#999"
                            value={importJson}
                            onChangeText={setImportJson}
                            multiline
                        />
                        {importResult && (
                            <View style={[styles.importResult, importResult.includes('✅') ? styles.importSuccess : styles.importError]}>
                                <Text style={styles.importResultText}>{importResult}</Text>
                            </View>
                        )}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowImportModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleImport}>
                                {importing ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.modalPrimaryText}>Import</Text>
                                )}
                            </TouchableOpacity>
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
                                <Text style={styles.publishSuccessEmoji}>🎉</Text>
                                <Text style={styles.publishSuccessTitle}>Published!</Text>
                                <Text style={styles.publishSuccessText}>Your book is now visible to all readers.</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Publish "{publishBookTitle}"</Text>
                                <Text style={styles.publishDescription}>
                                    Making your book public means all readers can discover and chat with your characters.
                                </Text>

                                <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted(!termsAccepted)}>
                                    <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                                        {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <Text style={styles.termsText}>
                                        I confirm that I have the rights to publish this book.
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPublishModal(false)}>
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalPrimaryBtn, !termsAccepted && styles.modalPrimaryBtnDisabled]}
                                        onPress={handlePublish}
                                        disabled={!termsAccepted}
                                    >
                                        {publishing ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text style={styles.modalPrimaryText}>Publish</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* FAB */}
            {!loading && books.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => router.push('/onboarding/author/book-info')}>
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            <ClarityModal visible={showClarityModal} onClose={() => setShowClarityModal(false)} character={clarityCharacter} />

            {/* Eval Modal */}
            <Modal visible={showEvalModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 500, maxHeight: '80%' }]}>
                        <View style={styles.evalModalHeader}>
                            <Text style={styles.modalTitle}>
                                Evaluate: {evalCharacter?.name}
                            </Text>
                            <TouchableOpacity onPress={() => setShowEvalModal(false)}>
                                <Text style={{ fontSize: 24, color: '#888' }}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ flex: 1 }}>
                            <EvalReportCard
                                evalResult={evalResult}
                                loading={evalLoading}
                                onRunEval={runEval}
                                onPublish={() => {
                                    setShowEvalModal(false);
                                    // Could trigger publish flow here
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pageTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 22,
        color: DesignTokens.colors.primary,
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayBox: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    overlayText: {
        fontFamily: 'Outfit_500Medium',
        marginTop: 12,
        color: '#666',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    contentDesktop: {
        maxWidth: 700,
        alignSelf: 'center',
        width: '100%',
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        gap: 20,
    },
    emptyText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 15,
        color: '#888',
    },
    emptyButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 0.5,
    },
    emptyButtonArrow: {
        fontSize: 16,
        color: DesignTokens.colors.textOnPrimary,
    },
    booksContainer: {
        gap: 20,
    },
    bookCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        overflow: 'hidden',
    },
    bookHeader: {
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    bookTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    bookTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 18,
        color: DesignTokens.colors.primary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusDraft: {
        backgroundColor: '#fef3c7',
    },
    statusPublished: {
        backgroundColor: '#dcfce7',
    },
    statusText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 10,
    },
    statusTextDraft: {
        color: '#92400e',
    },
    statusTextPublished: {
        color: '#166534',
    },
    bookMeta: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#888',
    },
    charactersSection: {
        padding: 16,
    },
    charactersList: {
        gap: 10,
    },
    characterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 10,
    },
    characterAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    characterAvatarText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: 'white',
    },
    characterInfo: {
        flex: 1,
    },
    characterName: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        color: '#333',
    },
    characterRole: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        color: '#888',
    },
    noCharacters: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#999',
        fontStyle: 'italic',
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionLink: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 13,
        color: DesignTokens.colors.primary,
        marginRight: 16,
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 18,
        color: DesignTokens.colors.primary,
        marginBottom: 16,
    },
    importInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        minHeight: 120,
        fontFamily: 'SpaceMono',
        fontSize: 11,
        textAlignVertical: 'top',
    },
    importResult: {
        marginTop: 12,
        padding: 10,
        borderRadius: 8,
        textAlign: 'center',
    },
    importSuccess: {
        backgroundColor: '#dcfce7',
    },
    importError: {
        backgroundColor: '#fee2e2',
    },
    importResultText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 20,
    },
    modalCancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    modalCancelText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        color: '#888',
    },
    modalPrimaryBtn: {
        backgroundColor: DesignTokens.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    modalPrimaryBtnDisabled: {
        backgroundColor: '#ddd',
    },
    modalPrimaryText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        color: 'white',
    },
    publishSuccess: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    publishSuccessEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    publishSuccessTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 22,
        color: DesignTokens.colors.primary,
        marginBottom: 8,
    },
    publishSuccessText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#888',
    },
    publishDescription: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 20,
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        marginBottom: 20,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: DesignTokens.colors.primary,
        borderColor: DesignTokens.colors.primary,
    },
    checkmark: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    termsText: {
        flex: 1,
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#444',
        lineHeight: 18,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: DesignTokens.colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    fabText: {
        fontSize: 28,
        color: 'white',
        fontWeight: 'bold',
    },
    evalButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    evalButtonText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 11,
        color: '#666',
    },
    evalModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    // Certification State Badges
    certBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    certBadgeCertified: {
        backgroundColor: '#dcfce7',
    },
    certBadgeEvaluated: {
        backgroundColor: '#dbeafe',
    },
    certBadgeMonitored: {
        backgroundColor: '#fef3c7',
    },
    certBadgeText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 8,
        color: '#333',
        letterSpacing: 0.5,
    },
});
