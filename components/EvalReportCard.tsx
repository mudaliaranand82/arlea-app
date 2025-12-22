import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DesignTokens } from '../constants/DesignSystem';

export type EvalScores = {
    voiceFidelity: number;
    worldIntegrity: number;
    boundaryAwareness: number;
    ageAppropriateness: number;
    emotionalSafety: number;
    engagementQuality: number;
    metaHandling: number;
};

export type EvalFeedback = {
    voiceFidelity: string;
    worldIntegrity: string;
    boundaryAwareness: string;
    ageAppropriateness: string;
    emotionalSafety: string;
    engagementQuality: string;
    metaHandling: string;
};

export type EvalResult = {
    scores: EvalScores;
    feedback: EvalFeedback;
    totalScore: number;
    passed: boolean;
    rating: 'excellent' | 'good' | 'acceptable' | 'needs_work' | 'not_ready';
    suggestions: string[];
};

type EvalReportCardProps = {
    evalResult: EvalResult | null;
    loading?: boolean;
    onRunEval?: () => void;
    onPublish?: () => void;
};

const DIMENSION_LABELS: Record<keyof EvalScores, string> = {
    voiceFidelity: 'Voice Fidelity',
    worldIntegrity: 'World Integrity',
    boundaryAwareness: 'Boundary Awareness',
    ageAppropriateness: 'Age Appropriate',
    emotionalSafety: 'Emotional Safety',
    engagementQuality: 'Engagement',
    metaHandling: 'Meta Handling',
};

const RATING_CONFIG = {
    excellent: { label: '⭐⭐⭐⭐⭐ Excellent', color: '#22c55e', description: 'Ready to publish!' },
    good: { label: '⭐⭐⭐⭐ Good', color: '#84cc16', description: 'Minor tuning recommended' },
    acceptable: { label: '⭐⭐⭐ Acceptable', color: '#eab308', description: 'Review suggested' },
    needs_work: { label: '⭐⭐ Needs Work', color: '#f97316', description: 'Significant issues' },
    not_ready: { label: '⭐ Not Ready', color: '#ef4444', description: 'Major revision required' },
};

function ScoreBar({ label, score, feedback }: { label: string; score: number; feedback: string }) {
    const getColor = (s: number) => {
        if (s >= 4.5) return '#22c55e';
        if (s >= 3.5) return '#84cc16';
        if (s >= 2.5) return '#eab308';
        if (s >= 1.5) return '#f97316';
        return '#ef4444';
    };

    return (
        <View style={styles.scoreRow}>
            <View style={styles.scoreLabelRow}>
                <Text style={styles.scoreLabel}>{label}</Text>
                <Text style={[styles.scoreValue, { color: getColor(score) }]}>{score}/5</Text>
            </View>
            <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(score / 5) * 100}%`, backgroundColor: getColor(score) }]} />
            </View>
            <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
    );
}

export function EvalReportCard({ evalResult, loading, onRunEval, onPublish }: EvalReportCardProps) {
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
                    <Text style={styles.loadingTitle}>Running Evaluation...</Text>
                    <Text style={styles.loadingSubtitle}>This may take a minute. We're testing your character.</Text>
                </View>
            </View>
        );
    }

    if (!evalResult) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Character Evaluation</Text>
                    <Text style={styles.emptyText}>
                        Run an evaluation to test your character's quality across 7 dimensions.
                        You need a score of 28/35 to publish.
                    </Text>
                    {onRunEval && (
                        <TouchableOpacity style={styles.runButton} onPress={onRunEval}>
                            <Text style={styles.runButtonText}>RUN EVAL</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    const ratingConfig = RATING_CONFIG[evalResult.rating];

    return (
        <View style={styles.container}>
            {/* Header with overall score */}
            <View style={[styles.header, { borderColor: ratingConfig.color }]}>
                <View style={styles.scoreCircle}>
                    <Text style={styles.totalScore}>{evalResult.totalScore}</Text>
                    <Text style={styles.totalScoreMax}>/35</Text>
                </View>
                <View style={styles.ratingInfo}>
                    <Text style={[styles.ratingLabel, { color: ratingConfig.color }]}>
                        {ratingConfig.label}
                    </Text>
                    <Text style={styles.ratingDescription}>{ratingConfig.description}</Text>
                </View>
            </View>

            {/* Dimension scores */}
            <View style={styles.scoresSection}>
                {(Object.keys(DIMENSION_LABELS) as (keyof EvalScores)[]).map((key) => (
                    <ScoreBar
                        key={key}
                        label={DIMENSION_LABELS[key]}
                        score={evalResult.scores[key]}
                        feedback={evalResult.feedback[key]}
                    />
                ))}
            </View>

            {/* Suggestions */}
            {evalResult.suggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                    <Text style={styles.suggestionsTitle}>Suggestions for Improvement</Text>
                    {evalResult.suggestions.map((suggestion, i) => (
                        <View key={i} style={styles.suggestionRow}>
                            <Text style={styles.suggestionBullet}>•</Text>
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
                {onRunEval && (
                    <TouchableOpacity style={styles.rerunButton} onPress={onRunEval}>
                        <Text style={styles.rerunButtonText}>RE-RUN EVAL</Text>
                    </TouchableOpacity>
                )}
                {onPublish && evalResult.passed && (
                    <TouchableOpacity style={styles.publishButton} onPress={onPublish}>
                        <Text style={styles.publishButtonText}>PUBLISH CHARACTER</Text>
                    </TouchableOpacity>
                )}
            </View>

            {!evalResult.passed && (
                <View style={styles.failedNotice}>
                    <Text style={styles.failedText}>
                        Score must be 28+ to publish. Review suggestions above.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        overflow: 'hidden',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 18,
        color: DesignTokens.colors.primary,
        marginTop: 16,
    },
    loadingSubtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    emptyState: {
        padding: 30,
        alignItems: 'center',
    },
    emptyTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 18,
        color: DesignTokens.colors.primary,
        marginBottom: 10,
    },
    emptyText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    runButton: {
        backgroundColor: DesignTokens.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    runButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: 'white',
        letterSpacing: 0.5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 3,
    },
    scoreCircle: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginRight: 16,
    },
    totalScore: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 36,
        color: DesignTokens.colors.primary,
    },
    totalScoreMax: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 18,
        color: '#888',
    },
    ratingInfo: {
        flex: 1,
    },
    ratingLabel: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 16,
    },
    ratingDescription: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    scoresSection: {
        padding: 16,
    },
    scoreRow: {
        marginBottom: 16,
    },
    scoreLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    scoreLabel: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        color: '#333',
    },
    scoreValue: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 13,
    },
    barContainer: {
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    feedbackText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 11,
        color: '#888',
        marginTop: 4,
    },
    suggestionsSection: {
        padding: 16,
        backgroundColor: '#fff9e6',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    suggestionsTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: '#92400e',
        marginBottom: 10,
    },
    suggestionRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    suggestionBullet: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#92400e',
        marginRight: 8,
    },
    suggestionText: {
        flex: 1,
        fontFamily: 'Outfit_400Regular',
        fontSize: 13,
        color: '#78350f',
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        padding: 16,
        justifyContent: 'space-between',
    },
    rerunButton: {
        flex: 1,
        paddingVertical: 14,
        marginRight: 8,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    rerunButtonText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
        color: '#555',
        letterSpacing: 0.5,
    },
    publishButton: {
        flex: 1,
        paddingVertical: 14,
        marginLeft: 8,
        borderRadius: 8,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    publishButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        color: 'white',
        letterSpacing: 0.5,
    },
    failedNotice: {
        padding: 14,
        backgroundColor: '#fee2e2',
        borderTopWidth: 1,
        borderTopColor: '#fecaca',
    },
    failedText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        color: '#991b1b',
        textAlign: 'center',
    },
});
