import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopNav } from '../../components/TopNav';
import { DesignTokens } from '../../constants/DesignSystem';
import { db, functions } from '../../firebaseConfig';

// Types
type Character = {
    id: string;
    name: string;
    bookId: string;
};

type StressTestBatch = {
    id: string;
    createdAt: any;
    conversationCount: number;
    status: string;
};

type JudgeResult = {
    convId: string;
    category: string;
    scores?: Record<string, number>;
    totalScore?: number;
    concerns?: string[];
    verdict?: string;
    error?: string;
};

type JudgeData = {
    judgeId: string;
    judgeName: string;
    results: JudgeResult[];
};

type ToastType = 'success' | 'error' | 'info';

const DIMENSION_KEYS = [
    'voiceFidelity',
    'worldIntegrity',
    'boundaryAwareness',
    'ageAppropriateness',
    'emotionalSafety',
    'engagementQuality',
    'metaHandling'
];

const DIMENSION_LABELS: Record<string, string> = {
    voiceFidelity: 'Voice Fidelity',
    worldIntegrity: 'Canon Integrity',
    boundaryAwareness: 'Boundary Awareness',
    ageAppropriateness: 'Age Appropriate',
    emotionalSafety: 'Emotional Safety',
    engagementQuality: 'Engagement',
    metaHandling: 'Meta Handling'
};

// Step configuration
const STEPS = [
    { num: 1, title: 'Select Character', icon: '👤', color: '#6366f1', desc: 'Choose which character to stress test' },
    { num: 2, title: 'Generate Scenarios', icon: '🧪', color: '#8b5cf6', desc: 'Create synthetic conversations' },
    { num: 3, title: 'Run Judges', icon: '⚖️', color: '#ec4899', desc: 'Score with AI judges' },
    { num: 4, title: 'Review Report', icon: '📊', color: '#14b8a6', desc: 'Analyze scores & concerns' },
];

// Toast Component
const Toast = ({ message, type, visible, onHide }: { message: string; type: ToastType; visible: boolean; onHide: () => void }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.delay(3000),
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => onHide());
        }
    }, [visible]);

    if (!visible) return null;

    const bgColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';
    const icon = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'close-circle' : 'information-circle';

    return (
        <Animated.View style={[styles.toast, { backgroundColor: bgColor, opacity: fadeAnim }]}>
            <Ionicons name={icon as any} size={20} color="#fff" />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

export default function ReviewBoardDashboard() {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [batches, setBatches] = useState<StressTestBatch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<StressTestBatch | null>(null);
    const [judges, setJudges] = useState<JudgeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [scoring, setScoring] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '', type: 'info', visible: false
    });

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type, visible: true });
    };

    // Fetch characters
    useEffect(() => {
        const fetchCharacters = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(collection(db, 'characters'));
                const chars = snap.docs.map(d => ({ id: d.id, ...d.data() } as Character));
                setCharacters(chars);
                if (chars.length > 0) setSelectedCharacter(chars[0]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchCharacters();
    }, []);

    // Fetch batches when character changes
    useEffect(() => {
        if (!selectedCharacter) return;
        const fetchBatches = async () => {
            try {
                const batchQuery = query(
                    collection(db, 'characters', selectedCharacter.id, 'stress_tests'),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                const snap = await getDocs(batchQuery);
                const batchList = snap.docs.map(d => ({ id: d.id, ...d.data() } as StressTestBatch));
                setBatches(batchList);
                if (batchList.length > 0) setSelectedBatch(batchList[0]);
                else setSelectedBatch(null);
            } catch (e) {
                console.error(e);
                setBatches([]);
            }
        };
        fetchBatches();
    }, [selectedCharacter]);

    // Fetch judge data when batch changes
    useEffect(() => {
        if (!selectedCharacter || !selectedBatch) {
            setJudges([]);
            return;
        }
        const fetchJudges = async () => {
            try {
                const judgesSnap = await getDocs(
                    collection(db, 'characters', selectedCharacter.id, 'stress_tests', selectedBatch.id, 'judges')
                );
                setJudges(judgesSnap.docs.map(d => d.data() as JudgeData));
            } catch (e) {
                console.error(e);
                setJudges([]);
            }
        };
        fetchJudges();
    }, [selectedBatch]);

    const handleGenerateStressTest = async () => {
        if (!selectedCharacter) return;
        setGenerating(true);
        try {
            const generate = httpsCallable(functions, 'generateStressTestConversations');
            const result = await generate({ characterId: selectedCharacter.id, count: 21 });
            showToast(`Generated ${(result.data as any).conversationCount} scenarios`, 'success');
            setSelectedCharacter({ ...selectedCharacter });
        } catch (e: any) {
            showToast(`Generation failed: ${e.message}`, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleScoreBatch = async () => {
        if (!selectedCharacter || !selectedBatch) return;
        setScoring(true);
        showToast('Running judges... this may take a few minutes', 'info');
        try {
            const scoreArlea = httpsCallable(functions, 'scoreStressTestBatch');
            await scoreArlea({ characterId: selectedCharacter.id, batchId: selectedBatch.id });

            const runJudges = httpsCallable(functions, 'runExternalJudges');
            await runJudges({ characterId: selectedCharacter.id, batchId: selectedBatch.id });

            showToast('All judges complete! Loading results...', 'success');
            setSelectedBatch({ ...selectedBatch });
        } catch (e: any) {
            showToast(`Scoring failed: ${e.message}`, 'error');
        } finally {
            setScoring(false);
        }
    };

    // Calculate average scores per judge per dimension
    const getAverageScores = (judgeData: JudgeData): Record<string, number> => {
        const totals: Record<string, number> = {};
        const counts: Record<string, number> = {};
        for (const r of judgeData.results) {
            if (!r.scores) continue;
            for (const dim of DIMENSION_KEYS) {
                if (r.scores[dim] !== undefined) {
                    totals[dim] = (totals[dim] || 0) + r.scores[dim];
                    counts[dim] = (counts[dim] || 0) + 1;
                }
            }
        }
        const avgs: Record<string, number> = {};
        for (const dim of DIMENSION_KEYS) {
            avgs[dim] = counts[dim] ? parseFloat((totals[dim] / counts[dim]).toFixed(1)) : 0;
        }
        return avgs;
    };

    const getScoreColor = (score: number): string => {
        if (score >= 4.5) return '#22c55e';
        if (score >= 4) return '#86efac';
        if (score >= 3.5) return '#fde047';
        if (score >= 3) return '#fb923c';
        return '#ef4444';
    };

    const getAllConcerns = (): string[] => {
        const concerns: string[] = [];
        for (const judge of judges) {
            if (judge.judgeId === 'arlea') continue;
            for (const r of judge.results) {
                if (r.concerns) concerns.push(...r.concerns);
            }
        }
        return [...new Set(concerns)].filter(c => c && c !== 'List any specific concerns');
    };

    // Determine current step
    const getCurrentStep = (): number => {
        if (!selectedCharacter) return 1;
        if (batches.length === 0) return 2;
        if (judges.length === 0) return 3;
        return 4;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <TopNav />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
                    <Text style={styles.loadingText}>Loading Review Board...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentStep = getCurrentStep();

    return (
        <SafeAreaView style={styles.container}>
            <TopNav />

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>🔬 Synthetic Review Board</Text>
                    <Text style={styles.pageSubtitle}>Multi-judge evaluation pipeline for character governance</Text>
                </View>

                {/* Step Progress Indicator */}
                <View style={styles.stepsContainer}>
                    {STEPS.map((step, idx) => (
                        <View key={step.num} style={styles.stepWrapper}>
                            <View style={[
                                styles.stepCircle,
                                { backgroundColor: currentStep >= step.num ? step.color : '#e2e8f0' }
                            ]}>
                                <Text style={styles.stepIcon}>{step.icon}</Text>
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                currentStep >= step.num && { color: step.color, fontWeight: '700' }
                            ]}>{step.title}</Text>
                            {idx < STEPS.length - 1 && (
                                <View style={[
                                    styles.stepLine,
                                    currentStep > step.num && { backgroundColor: step.color }
                                ]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* STEP 1: Character Selection */}
                <View style={[styles.section, { borderLeftColor: STEPS[0].color }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionNumber, { backgroundColor: STEPS[0].color }]}>1</Text>
                        <View>
                            <Text style={styles.sectionTitle}>Select Character</Text>
                            <Text style={styles.sectionDesc}>Choose which AI character to stress test</Text>
                        </View>
                    </View>
                    <FlatList
                        data={characters}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.characterPill, selectedCharacter?.id === item.id && styles.characterPillActive]}
                                onPress={() => setSelectedCharacter(item)}
                            >
                                <View style={styles.characterAvatar}>
                                    <Text style={styles.characterAvatarText}>{item.name?.[0]}</Text>
                                </View>
                                <Text style={[styles.characterName, selectedCharacter?.id === item.id && styles.characterNameActive]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* STEP 2: Generate Scenarios */}
                <View style={[styles.section, { borderLeftColor: STEPS[1].color }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionNumber, { backgroundColor: STEPS[1].color }]}>2</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>Generate Stress Scenarios</Text>
                            <Text style={styles.sectionDesc}>Create 21 synthetic conversations covering edge cases</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: STEPS[1].color }, generating && styles.actionBtnDisabled]}
                            onPress={handleGenerateStressTest}
                            disabled={generating || !selectedCharacter}
                        >
                            {generating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.actionBtnText}>🧪 GENERATE</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Batch Selector */}
                    {batches.length > 0 && (
                        <View style={styles.batchSelector}>
                            <Text style={styles.batchLabel}>EXISTING BATCHES</Text>
                            <FlatList
                                data={batches}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.batchPill, selectedBatch?.id === item.id && styles.batchPillActive]}
                                        onPress={() => setSelectedBatch(item)}
                                    >
                                        <Text style={[styles.batchText, selectedBatch?.id === item.id && styles.batchTextActive]}>
                                            {item.conversationCount} scenarios
                                        </Text>
                                        <View style={[styles.batchDot, item.status === 'fully_scored' && styles.batchDotGreen]} />
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}
                </View>

                {/* STEP 3: Run Judges */}
                <View style={[styles.section, { borderLeftColor: STEPS[2].color }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionNumber, { backgroundColor: STEPS[2].color }]}>3</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>Run AI Judges</Text>
                            <Text style={styles.sectionDesc}>Score with GPT-4 (Parent), Claude (Teacher), Gemini (Librarian)</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: STEPS[2].color }, (scoring || !selectedBatch) && styles.actionBtnDisabled]}
                            onPress={handleScoreBatch}
                            disabled={scoring || !selectedBatch}
                        >
                            {scoring ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.actionBtnText}>⚖️ RUN JUDGES</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {scoring && (
                        <View style={styles.progressBox}>
                            <ActivityIndicator size="small" color={STEPS[2].color} />
                            <Text style={styles.progressText}>Processing 21 conversations × 3 judges... this takes 2-5 minutes</Text>
                        </View>
                    )}
                </View>

                {/* STEP 4: Review Report */}
                <View style={[styles.section, { borderLeftColor: STEPS[3].color }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionNumber, { backgroundColor: STEPS[3].color }]}>4</Text>
                        <View>
                            <Text style={styles.sectionTitle}>Review Report</Text>
                            <Text style={styles.sectionDesc}>Analyze score variance and aggregated concerns</Text>
                        </View>
                    </View>

                    {judges.length > 0 ? (
                        <>
                            {/* Score Heatmap */}
                            <View style={styles.heatmapContainer}>
                                <Text style={styles.heatmapTitle}>📊 Score Heatmap</Text>
                                <View style={styles.heatmapTable}>
                                    {/* Header */}
                                    <View style={styles.heatmapRow}>
                                        <Text style={[styles.heatmapCell, styles.heatmapHeaderCell, { flex: 1.5 }]}>Dimension</Text>
                                        {judges.map(j => (
                                            <Text key={j.judgeId} style={[styles.heatmapCell, styles.heatmapHeaderCell]}>
                                                {j.judgeId === 'arlea' ? '🤖' : j.judgeId.includes('parent') ? '👨‍👩‍👧' : j.judgeId.includes('teacher') ? '👩‍🏫' : '📚'}
                                            </Text>
                                        ))}
                                    </View>
                                    {/* Rows */}
                                    {DIMENSION_KEYS.map(dim => {
                                        const scores = judges.map(j => getAverageScores(j)[dim]);
                                        const hasVariance = Math.max(...scores) - Math.min(...scores) > 1;
                                        return (
                                            <View key={dim} style={[styles.heatmapRow, hasVariance && styles.heatmapRowWarning]}>
                                                <Text style={[styles.heatmapCell, { flex: 1.5, fontWeight: '500' }]}>
                                                    {DIMENSION_LABELS[dim]}
                                                </Text>
                                                {judges.map(j => {
                                                    const avg = getAverageScores(j)[dim];
                                                    return (
                                                        <View key={j.judgeId} style={[styles.heatmapCell, { backgroundColor: getScoreColor(avg) }]}>
                                                            <Text style={styles.heatmapScore}>{avg}</Text>
                                                        </View>
                                                    );
                                                })}
                                                {hasVariance && <Ionicons name="warning" size={14} color="#f59e0b" />}
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Concerns */}
                            {getAllConcerns().length > 0 && (
                                <View style={styles.concernsBox}>
                                    <Text style={styles.concernsTitle}>⚠️ Aggregated Concerns</Text>
                                    {getAllConcerns().map((c, i) => (
                                        <Text key={i} style={styles.concernItem}>• {c}</Text>
                                    ))}
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.emptyReport}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyTitle}>No results yet</Text>
                            <Text style={styles.emptyDesc}>Generate scenarios and run judges to see the report</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#64748b',
    },
    content: {
        padding: 20,
        paddingBottom: 60,
    },
    contentDesktop: {
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        marginBottom: 24,
    },
    pageTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 28,
        color: DesignTokens.colors.primary,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 15,
        color: '#64748b',
    },

    // Steps Progress
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    stepWrapper: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    stepCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepIcon: {
        fontSize: 20,
    },
    stepLabel: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 11,
        color: '#94a3b8',
        textAlign: 'center',
    },
    stepLine: {
        position: 'absolute',
        top: 22,
        left: '55%',
        width: '90%',
        height: 3,
        backgroundColor: '#e2e8f0',
        zIndex: -1,
    },

    // Sections
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    sectionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        color: '#fff',
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 28,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 16,
        color: '#1e293b',
    },
    sectionDesc: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#64748b',
    },

    // Character Pills
    characterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    characterPillActive: {
        backgroundColor: '#ede9fe',
        borderColor: '#8b5cf6',
    },
    characterAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    characterAvatarText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: '#fff',
    },
    characterName: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        color: '#334155',
    },
    characterNameActive: {
        fontFamily: 'Outfit_700Bold',
        color: '#6366f1',
    },

    // Action Button
    actionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    actionBtnDisabled: {
        opacity: 0.5,
    },
    actionBtnText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: '#fff',
        letterSpacing: 0.5,
    },

    // Batch Selector
    batchSelector: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    batchLabel: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 10,
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 8,
    },
    batchPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginRight: 8,
    },
    batchPillActive: {
        backgroundColor: '#8b5cf6',
    },
    batchText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 12,
        color: '#64748b',
    },
    batchTextActive: {
        color: '#fff',
    },
    batchDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fbbf24',
        marginLeft: 6,
    },
    batchDotGreen: {
        backgroundColor: '#22c55e',
    },

    // Progress Box
    progressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fdf4ff',
        padding: 12,
        borderRadius: 8,
        gap: 10,
    },
    progressText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#a855f7',
        flex: 1,
    },

    // Heatmap
    heatmapContainer: {
        marginTop: 8,
    },
    heatmapTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: '#1e293b',
        marginBottom: 12,
    },
    heatmapTable: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    heatmapRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heatmapRowWarning: {
        backgroundColor: '#fffbeb',
    },
    heatmapCell: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heatmapHeaderCell: {
        backgroundColor: '#f1f5f9',
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: '#475569',
    },
    heatmapScore: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: '#fff',
    },

    // Concerns
    concernsBox: {
        marginTop: 16,
        backgroundColor: '#fffbeb',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    concernsTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: '#92400e',
        marginBottom: 8,
    },
    concernItem: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#78350f',
        marginBottom: 4,
    },

    // Empty Report
    emptyReport: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 16,
        color: '#64748b',
    },
    emptyDesc: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4,
    },

    // Toast
    toast: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 10,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    toastText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        color: '#fff',
        flex: 1,
    },
});
