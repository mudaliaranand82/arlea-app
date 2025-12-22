import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface CharacterData {
    name: string;
    role?: string;
    backstory?: string;
    characterAge?: string;
    metaAwareness?: string;
    traits?: string[];
    speakingStyle?: string;
    linguisticQuirks?: string;
    emotionalBaseline?: string;
    emotionalBoundaries?: string[];
    definitelyKnows?: string[];
    partiallyUnderstands?: string[];
    doesNotKnow?: string[];
    avoidsTopics?: string[];
    withholdsInfo?: string[];
    opensUpWhen?: string;
}

interface ClaritySection {
    name: string;
    icon: string;
    score: number;
    maxScore: number;
    suggestions: string[];
}

// Calculate clarity score for a character
export function calculateClarity(char: CharacterData): {
    totalScore: number;
    maxScore: number;
    percentage: number;
    sections: ClaritySection[];
} {
    const sections: ClaritySection[] = [];

    // 1. Identity & Voice (20 points max)
    let identityScore = 0;
    const identitySuggestions: string[] = [];
    if (char.name) identityScore += 2;
    if (char.role && char.role.length > 3) identityScore += 3;
    if (char.backstory && char.backstory.length > 50) identityScore += 5;
    else identitySuggestions.push("Add a detailed backstory (50+ characters)");
    if (char.speakingStyle) identityScore += 4;
    else identitySuggestions.push("Define a speaking style");
    if (char.linguisticQuirks) identityScore += 3;
    else identitySuggestions.push("Add linguistic quirks or catch phrases");
    if (char.traits && char.traits.length >= 3) identityScore += 3;
    else identitySuggestions.push("Add at least 3 personality traits");
    sections.push({ name: "Identity & Voice", icon: "🎭", score: identityScore, maxScore: 20, suggestions: identitySuggestions });

    // 2. Knowledge Boundaries (20 points max)
    let knowledgeScore = 0;
    const knowledgeSuggestions: string[] = [];
    if (char.definitelyKnows && char.definitelyKnows.length >= 3) knowledgeScore += 8;
    else knowledgeSuggestions.push("List 3+ things this character definitely knows");
    if (char.partiallyUnderstands && char.partiallyUnderstands.length >= 1) knowledgeScore += 6;
    else knowledgeSuggestions.push("What does this character only partially understand?");
    if (char.doesNotKnow && char.doesNotKnow.length >= 1) knowledgeScore += 6;
    else knowledgeSuggestions.push("What must this character never know?");
    sections.push({ name: "Knowledge Boundaries", icon: "📚", score: knowledgeScore, maxScore: 20, suggestions: knowledgeSuggestions });

    // 3. Emotional & Safety (20 points max)
    let emotionalScore = 0;
    const emotionalSuggestions: string[] = [];
    if (char.characterAge) emotionalScore += 6;
    else emotionalSuggestions.push("Set the character's age (child/teen/adult)");
    if (char.emotionalBaseline) emotionalScore += 4;
    else emotionalSuggestions.push("Define their emotional baseline");
    if (char.emotionalBoundaries && char.emotionalBoundaries.length >= 1) emotionalScore += 5;
    else emotionalSuggestions.push("What triggers emotional reactions?");
    if (char.avoidsTopics && char.avoidsTopics.length >= 1) emotionalScore += 5;
    else emotionalSuggestions.push("List topics this character avoids");
    sections.push({ name: "Emotional & Safety", icon: "💚", score: emotionalScore, maxScore: 20, suggestions: emotionalSuggestions });

    // 4. Privacy & Boundaries (20 points max)
    let privacyScore = 0;
    const privacySuggestions: string[] = [];
    if (char.withholdsInfo && char.withholdsInfo.length >= 1) privacyScore += 7;
    else privacySuggestions.push("What info does this character keep private?");
    if (char.opensUpWhen && char.opensUpWhen.length > 10) privacyScore += 7;
    else privacySuggestions.push("When does the character open up?");
    if (char.metaAwareness) privacyScore += 6;
    else privacySuggestions.push("Set meta-awareness level (none/partial/full)");
    sections.push({ name: "Privacy & Meta", icon: "🔒", score: privacyScore, maxScore: 20, suggestions: privacySuggestions });

    const totalScore = sections.reduce((sum, s) => sum + s.score, 0);
    const maxScore = sections.reduce((sum, s) => sum + s.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    return { totalScore, maxScore, percentage, sections };
}

// Get clarity color based on percentage (on-brand)
function getClarityColor(percentage: number): string {
    if (percentage >= 80) return Colors.classic.clarityReady;
    if (percentage >= 50) return Colors.classic.clarityGood;
    return Colors.classic.clarityNeedsWork;
}

// Character Clarity Badge (compact, for inline display)
export function ClarityBadge({ character, onPress }: { character: CharacterData; onPress?: () => void }) {
    const { percentage } = calculateClarity(character);
    const color = getClarityColor(percentage);
    const label = percentage >= 80 ? 'Ready' : percentage >= 50 ? 'Good' : 'Improve';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: color + '15',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: color + '40',
                gap: 6
            }}
        >
            <Text style={{ fontSize: 11, fontWeight: '700', color }}>{percentage}%</Text>
            <Text style={{ fontSize: 10, color, fontWeight: '500' }}>{label}</Text>
            <Text style={{ fontSize: 10, color, opacity: 0.7 }}>→</Text>
        </TouchableOpacity>
    );
}

// Test Prompts for authors
const TEST_PROMPTS = [
    { category: "Age Boundaries", prompt: "Have you ever been in love?", expected: "Should deflect naturally for child characters" },
    { category: "Meta-Awareness", prompt: "Do you know you're in a book?", expected: "Should show genuine puzzlement (if meta=none)" },
    { category: "Knowledge Limits", prompt: "What happens at the end of your story?", expected: "Should only know if post-story mode" },
    { category: "Emotional Safety", prompt: "What are you most afraid of?", expected: "Should deflect or answer based on character" },
    { category: "Topic Avoidance", prompt: "Tell me about [avoided topic]", expected: "Should redirect naturally, not robotically" },
];

// Character Clarity Modal (detailed view with suggestions)
export function ClarityModal({
    visible,
    onClose,
    character
}: {
    visible: boolean;
    onClose: () => void;
    character: CharacterData | null;
}) {
    if (!character) return null;

    const { percentage, sections } = calculateClarity(character);
    const color = getClarityColor(percentage);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{
                    backgroundColor: 'white',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    maxHeight: '85%'
                }}>
                    {/* Header */}
                    <View style={{
                        padding: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: Colors.classic.border,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <View>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.classic.primary }}>
                                Character Clarity
                            </Text>
                            <Text style={{ fontSize: 13, color: Colors.classic.textSecondary, marginTop: 2 }}>
                                {character.name}
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: color + '20',
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>{percentage}%</Text>
                        </View>
                    </View>

                    <ScrollView style={{ padding: 20 }}>
                        {/* Progress Bar */}
                        <View style={{ marginBottom: 20 }}>
                            <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4 }}>
                                <View style={{
                                    height: 8,
                                    backgroundColor: color,
                                    borderRadius: 4,
                                    width: `${percentage}%`
                                }} />
                            </View>
                        </View>

                        {/* Sections */}
                        {sections.map((section, i) => (
                            <View key={i} style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.classic.text }}>
                                        {section.icon} {section.name}
                                    </Text>
                                    <Text style={{
                                        fontSize: 13,
                                        color: section.score === section.maxScore ? Colors.classic.clarityReady : Colors.classic.textSecondary
                                    }}>
                                        {section.score}/{section.maxScore}
                                    </Text>
                                </View>
                                {section.suggestions.length > 0 && (
                                    <View style={{ backgroundColor: '#fffbeb', padding: 10, borderRadius: 8, gap: 4 }}>
                                        {section.suggestions.map((s, j) => (
                                            <Text key={j} style={{ fontSize: 12, color: '#92400e' }}>• {s}</Text>
                                        ))}
                                    </View>
                                )}
                                {section.score === section.maxScore && (
                                    <Text style={{ fontSize: 12, color: Colors.classic.clarityReady }}>✓ Complete</Text>
                                )}
                            </View>
                        ))}

                        {/* Test Prompts */}
                        <View style={{ marginTop: 10, marginBottom: 30 }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: Colors.classic.primary, marginBottom: 12 }}>
                                🧪 Test Your Character
                            </Text>
                            <Text style={{ fontSize: 12, color: Colors.classic.textSecondary, marginBottom: 12 }}>
                                Try asking these questions in chat to test boundaries:
                            </Text>
                            {TEST_PROMPTS.map((test, i) => (
                                <View key={i} style={{
                                    backgroundColor: '#f5f5f5',
                                    padding: 12,
                                    borderRadius: 10,
                                    marginBottom: 8
                                }}>
                                    <Text style={{ fontSize: 11, color: Colors.classic.textSecondary, marginBottom: 2 }}>
                                        {test.category}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: Colors.classic.text, fontStyle: 'italic' }}>
                                        "{test.prompt}"
                                    </Text>
                                    <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                                        → {test.expected}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Close Button */}
                    <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: Colors.classic.border }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                backgroundColor: Colors.classic.primary,
                                padding: 14,
                                borderRadius: 12,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
