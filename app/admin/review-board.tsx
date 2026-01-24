import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

const DIMENSION_KEYS = [
    'voiceFidelity',
    'worldIntegrity',
    'boundaryAwareness',
    'ageAppropriateness',
    'emotionalSafety',
    'engagementQuality',
    'metaHandling'
];

const DIMENSION_SHORT = {
    voiceFidelity: 'Voice',
    worldIntegrity: 'Canon',
    boundaryAwareness: 'Boundary',
    ageAppropriateness: 'Age',
    emotionalSafety: 'Emo',
    engagementQuality: 'Engage',
    metaHandling: 'Meta'
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
            alert(`Generated ${(result.data as any).conversationCount} conversations. Batch: ${(result.data as any).batchId}`);
            // Refresh batches
            setSelectedCharacter({ ...selectedCharacter });
        } catch (e: any) {
            alert('Generation failed: ' + e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleScoreBatch = async () => {
        if (!selectedCharacter || !selectedBatch) return;
        setScoring(true);
        try {
            // First run ARLEA scoring
            const scoreArlea = httpsCallable(functions, 'scoreStressTestBatch');
            await scoreArlea({ characterId: selectedCharacter.id, batchId: selectedBatch.id });

            // Then run external judges
            const runJudges = httpsCallable(functions, 'runExternalJudges');
            await runJudges({ characterId: selectedCharacter.id, batchId: selectedBatch.id });

            alert('Scoring complete! Refresh to see results.');
            setSelectedBatch({ ...selectedBatch });
        } catch (e: any) {
            alert('Scoring failed: ' + e.message);
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

    // Get color for score
    const getScoreColor = (score: number): string => {
        if (score >= 4.5) return '#22c55e';
        if (score >= 4) return '#86efac';
        if (score >= 3.5) return '#fde047';
        if (score >= 3) return '#fb923c';
        return '#ef4444';
    };

    // Collect all concerns from external judges
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

    return (
        <SafeAreaView style={styles.container}>
            <TopNav />

            <View style={[styles.content, isDesktop && styles.contentDesktop]}>
                {/* Header */}
                <Text style={styles.pageTitle}>🔬 Synthetic Review Board</Text>
                <Text style={styles.pageSubtitle}>Multi-judge evaluation pipeline for character governance</Text>

                {/* Character Selector */}
                <View style={styles.selectorContainer}>
                    <Text style={styles.sectionTitle}>CHARACTER</Text>
                    <FlatList
                        data={characters}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.pill, selectedCharacter?.id === item.id && styles.pillActive]}
                                onPress={() => setSelectedCharacter(item)}
                            >
                                <Text style={[styles.pillText, selectedCharacter?.id === item.id && styles.pillTextActive]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, generating && styles.actionButtonDisabled]}
                        onPress={handleGenerateStressTest}
                        disabled={generating}
                    >
                        {generating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.actionButtonText}>🧪 GENERATE STRESS TEST</Text>
                        )}
                    </TouchableOpacity>

                    {selectedBatch && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonSecondary, scoring && styles.actionButtonDisabled]}
                            onPress={handleScoreBatch}
                            disabled={scoring}
                        >
                            {scoring ? (
                                <ActivityIndicator size="small" color={DesignTokens.colors.primary} />
                            ) : (
                                <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>⚖️ RUN ALL JUDGES</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Batch Selector */}
                {batches.length > 0 && (
                    <View style={styles.selectorContainer}>
                        <Text style={styles.sectionTitle}>TEST BATCH</Text>
                        <FlatList
                            data={batches}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.pill, selectedBatch?.id === item.id && styles.pillActive]}
                                    onPress={() => setSelectedBatch(item)}
                                >
                                    <Text style={[styles.pillText, selectedBatch?.id === item.id && styles.pillTextActive]}>
                                        {item.id.substring(0, 12)}... ({item.conversationCount} convs)
                                    </Text>
                                    <View style={[styles.statusDot, item.status === 'fully_scored' && styles.statusDotGreen]} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Heatmap Table */}
                    {judges.length > 0 && (
                        <View style={styles.panel}>
                            <Text style={styles.panelTitle}>📊 SCORE HEATMAP</Text>

                            {/* Header Row */}
                            <View style={styles.heatmapRow}>
                                <Text style={[styles.heatmapCell, styles.heatmapHeader, { width: 80 }]}>Dimension</Text>
                                {judges.map(j => (
                                    <Text key={j.judgeId} style={[styles.heatmapCell, styles.heatmapHeader]}>
                                        {j.judgeId === 'arlea' ? '🤖 ARLEA' : j.judgeId === 'parent' ? '👨‍👩‍👧' : j.judgeId === 'teacher' ? '👩‍🏫' : '📚'}
                                    </Text>
                                ))}
                            </View>

                            {/* Data Rows */}
                            {DIMENSION_KEYS.map(dim => {
                                const scores = judges.map(j => getAverageScores(j)[dim]);
                                const maxScore = Math.max(...scores);
                                const minScore = Math.min(...scores);
                                const hasVariance = maxScore - minScore > 1;

                                return (
                                    <View key={dim} style={[styles.heatmapRow, hasVariance && styles.heatmapRowHighlight]}>
                                        <Text style={[styles.heatmapCell, { width: 80, fontWeight: '600' }]}>
                                            {(DIMENSION_SHORT as any)[dim]}
                                        </Text>
                                        {judges.map(j => {
                                            const avg = getAverageScores(j)[dim];
                                            return (
                                                <View
                                                    key={j.judgeId}
                                                    style={[styles.heatmapCell, { backgroundColor: getScoreColor(avg) }]}
                                                >
                                                    <Text style={styles.heatmapScore}>{avg}</Text>
                                                </View>
                                            );
                                        })}
                                        {hasVariance && (
                                            <Ionicons name="warning" size={14} color="#f59e0b" style={{ marginLeft: 4 }} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Concerns Panel */}
                    {getAllConcerns().length > 0 && (
                        <View style={[styles.panel, styles.concernsPanel]}>
                            <Text style={styles.panelTitle}>⚠️ AGGREGATED CONCERNS</Text>
                            {getAllConcerns().map((concern, idx) => (
                                <View key={idx} style={styles.concernItem}>
                                    <Text style={styles.concernText}>• {concern}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Empty State */}
                    {batches.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>🧪</Text>
                            <Text style={styles.emptyText}>No stress tests yet.</Text>
                            <Text style={styles.emptySubtext}>Click "Generate Stress Test" to create one.</Text>
                        </View>
                    )}

                    {selectedBatch && judges.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>⚖️</Text>
                            <Text style={styles.emptyText}>Batch not scored yet.</Text>
                            <Text style={styles.emptySubtext}>Click "Run All Judges" to score this batch.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'Outfit_400Regular',
        color: DesignTokens.colors.textLight,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    contentDesktop: {
        paddingHorizontal: 40,
        maxWidth: 900,
        alignSelf: 'center',
    },
    pageTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 24,
        color: DesignTokens.colors.primary,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
        marginBottom: 20,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    selectorContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 11,
        color: DesignTokens.colors.textLight,
        letterSpacing: 1,
        marginBottom: 8,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pillActive: {
        backgroundColor: DesignTokens.colors.primary,
    },
    pillText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        color: DesignTokens.colors.text,
    },
    pillTextActive: {
        color: DesignTokens.colors.textOnPrimary,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fbbf24',
        marginLeft: 6,
    },
    statusDotGreen: {
        backgroundColor: '#22c55e',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: DesignTokens.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    actionButtonSecondary: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: DesignTokens.colors.primary,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 0.5,
    },
    actionButtonTextSecondary: {
        color: DesignTokens.colors.primary,
    },
    panel: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: DesignTokens.colors.border,
        padding: 16,
        marginBottom: 16,
    },
    concernsPanel: {
        borderColor: '#fbbf24',
        backgroundColor: '#fffbeb',
    },
    panelTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    heatmapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    heatmapRowHighlight: {
        backgroundColor: '#fef3c7',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    heatmapCell: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
    },
    heatmapHeader: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 11,
        color: DesignTokens.colors.text,
        backgroundColor: '#f1f5f9',
    },
    heatmapScore: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: '#fff',
    },
    concernItem: {
        paddingVertical: 6,
    },
    concernText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#92400e',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 16,
        color: DesignTokens.colors.text,
    },
    emptySubtext: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
        marginTop: 4,
    },
});
