import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
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
    hasGovernanceAlert?: boolean;
};

type DimensionStats = {
    count: number;
    average: number;
    lastValue: number;
};

type CharacterStats = {
    totalEvals: number;
    lastEvalDate: any;
    dimensions: Record<string, DimensionStats>;
    lastRunAlerts?: any[];
};

type RegressionRun = {
    runId: string;
    totalGolden: number;
    passed: number;
    timestamp: any;
};

const DIMENSION_LABELS: Record<string, string> = {
    voiceFidelity: 'Voice',
    worldIntegrity: 'Canon',
    boundaryAwareness: 'Boundary',
    ageAppropriateness: 'Age Safe',
    emotionalSafety: 'Emotional',
    engagementQuality: 'Engage',
    metaHandling: 'Meta',
};

export default function GovernanceDashboard() {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [stats, setStats] = useState<CharacterStats | null>(null);
    const [regressionRuns, setRegressionRuns] = useState<RegressionRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningRegression, setRunningRegression] = useState(false);

    // Fetch all characters
    useEffect(() => {
        const fetchCharacters = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(collection(db, 'characters'));
                const chars = snap.docs.map(d => ({ id: d.id, ...d.data() } as Character));
                setCharacters(chars);
                if (chars.length > 0) {
                    setSelectedCharacter(chars[0]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchCharacters();
    }, []);

    // Fetch stats and regression runs when character changes
    useEffect(() => {
        if (!selectedCharacter) return;

        const fetchStats = async () => {
            try {
                const statsDoc = await getDoc(doc(db, 'characters', selectedCharacter.id, 'stats', 'current'));
                if (statsDoc.exists()) {
                    setStats(statsDoc.data() as CharacterStats);
                } else {
                    setStats(null);
                }

                // Fetch regression runs
                const runsQuery = query(
                    collection(db, 'characters', selectedCharacter.id, 'regression_runs'),
                    orderBy('timestamp', 'desc'),
                    limit(5)
                );
                const runsSnap = await getDocs(runsQuery);
                setRegressionRuns(runsSnap.docs.map(d => ({ runId: d.id, ...d.data() } as RegressionRun)));
            } catch (e) {
                console.error(e);
                setStats(null);
                setRegressionRuns([]);
            }
        };
        fetchStats();
    }, [selectedCharacter]);

    const handleRunRegression = async () => {
        if (!selectedCharacter) return;
        setRunningRegression(true);
        try {
            const runRegression = httpsCallable(functions, 'runRegressionSuite');
            const result = await runRegression({ characterId: selectedCharacter.id });
            alert(`Regression Complete! Passed: ${(result.data as any).passed}/${(result.data as any).totalGolden}`);
            // Refresh
            setSelectedCharacter({ ...selectedCharacter });
        } catch (e) {
            console.error(e);
            alert('Regression failed. See console.');
        } finally {
            setRunningRegression(false);
        }
    };

    const renderStatBar = (key: string, dimStats: DimensionStats) => {
        const avg = dimStats.average;
        const barWidth = (avg / 5) * 100;
        const color = avg >= 4 ? '#22c55e' : avg >= 3 ? '#eab308' : '#ef4444';

        return (
            <View key={key} style={styles.statRow}>
                <Text style={styles.statLabel}>{DIMENSION_LABELS[key] || key}</Text>
                <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.statValue}>{avg.toFixed(1)}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <TopNav />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
                    <Text style={styles.loadingText}>Loading Governance Data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TopNav />

            <View style={[styles.content, isDesktop && styles.contentDesktop]}>
                {/* Character Selector */}
                <View style={styles.selectorContainer}>
                    <Text style={styles.sectionTitle}>SELECT CHARACTER</Text>
                    <FlatList
                        data={characters}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.characterPill,
                                    selectedCharacter?.id === item.id && styles.characterPillActive,
                                    item.hasGovernanceAlert && styles.characterPillAlert,
                                ]}
                                onPress={() => setSelectedCharacter(item)}
                            >
                                <Text
                                    style={[
                                        styles.characterPillText,
                                        selectedCharacter?.id === item.id && styles.characterPillTextActive,
                                    ]}
                                >
                                    {item.name}
                                </Text>
                                {item.hasGovernanceAlert && (
                                    <Ionicons name="warning" size={14} color="#ef4444" style={{ marginLeft: 4 }} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Stats Panel */}
                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>DIMENSION AVERAGES</Text>
                        {stats ? (
                            <>
                                <Text style={styles.evalCountText}>
                                    Based on {stats.totalEvals} evaluations
                                </Text>
                                {Object.entries(stats.dimensions || {}).map(([key, dimStats]) =>
                                    renderStatBar(key, dimStats as DimensionStats)
                                )}
                            </>
                        ) : (
                            <Text style={styles.noDataText}>No evaluation data yet.</Text>
                        )}
                    </View>

                    {/* Alerts Panel */}
                    {stats?.lastRunAlerts && stats.lastRunAlerts.length > 0 && (
                        <View style={[styles.panel, styles.alertPanel]}>
                            <Text style={styles.panelTitle}>⚠️ DRIFT ALERTS</Text>
                            {stats.lastRunAlerts.map((alert, idx) => (
                                <View key={idx} style={styles.alertRow}>
                                    <Text style={styles.alertText}>
                                        {alert.type === 'drift_drop'
                                            ? `${DIMENSION_LABELS[alert.dimension]} dropped by ${alert.delta} (Avg: ${alert.oldAvg} → Now: ${alert.newVal})`
                                            : `${DIMENSION_LABELS[alert.dimension]} below safety threshold (${alert.val})`}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Regression Panel */}
                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>REGRESSION TESTS</Text>
                        <TouchableOpacity
                            style={[styles.runButton, runningRegression && styles.runButtonDisabled]}
                            onPress={handleRunRegression}
                            disabled={runningRegression}
                        >
                            {runningRegression ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.runButtonText}>RUN REGRESSION SUITE</Text>
                            )}
                        </TouchableOpacity>

                        {regressionRuns.length > 0 ? (
                            regressionRuns.map((run) => (
                                <View key={run.runId} style={styles.runRow}>
                                    <Text style={styles.runId}>{run.runId.substring(0, 8)}...</Text>
                                    <Text style={styles.runResult}>
                                        {run.passed}/{run.totalGolden} passed
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>No regression runs yet.</Text>
                        )}
                    </View>
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
    },
    scrollContent: {
        paddingBottom: 40,
    },
    selectorContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        letterSpacing: 1,
        marginBottom: 8,
    },
    characterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    characterPillActive: {
        backgroundColor: DesignTokens.colors.primary,
    },
    characterPillAlert: {
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    characterPillText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        color: DesignTokens.colors.text,
    },
    characterPillTextActive: {
        color: DesignTokens.colors.textOnPrimary,
    },
    panel: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: DesignTokens.colors.border,
        padding: 20,
        marginBottom: 16,
    },
    alertPanel: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    panelTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        letterSpacing: 1,
        marginBottom: 16,
    },
    evalCountText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
        marginBottom: 12,
    },
    noDataText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: DesignTokens.colors.textLight,
        textAlign: 'center',
        paddingVertical: 20,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statLabel: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: DesignTokens.colors.text,
        width: 80,
    },
    barContainer: {
        flex: 1,
        height: 12,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
        borderRadius: 6,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 6,
    },
    statValue: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.text,
        width: 30,
        textAlign: 'right',
    },
    alertRow: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
    },
    alertText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#b91c1c',
    },
    runButton: {
        backgroundColor: DesignTokens.colors.primary,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    runButtonDisabled: {
        opacity: 0.6,
    },
    runButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: DesignTokens.colors.textOnPrimary,
        letterSpacing: 0.5,
    },
    runRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    runId: {
        fontFamily: 'SpaceMono',
        fontSize: 12,
        color: DesignTokens.colors.textLight,
    },
    runResult: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: DesignTokens.colors.text,
    },
});
