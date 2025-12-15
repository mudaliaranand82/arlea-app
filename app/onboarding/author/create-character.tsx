import { router, useLocalSearchParams } from 'expo-router';
import { signOut } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../firebaseConfig';
import { CharacterBible, DEFAULT_CHARACTER_BIBLE } from '../../../services/types';

// Collapsible Section Component
const CollapsibleSection = ({
    title,
    expanded,
    onToggle,
    children
}: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) => (
    <View style={{ marginBottom: 15 }}>
        <TouchableOpacity
            onPress={onToggle}
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: Colors.classic.border
            }}
        >
            <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.classic.primary
            }}>{title}</Text>
            <Text style={{ fontSize: 18, color: Colors.classic.textSecondary }}>
                {expanded ? '−' : '+'}
            </Text>
        </TouchableOpacity>
        {expanded && <View style={{ paddingTop: 15 }}>{children}</View>}
    </View>
);

export default function CreateCharacter() {
    const { user } = useAuth();
    const { bookId } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);

    // Expanded sections state
    const [basicExpanded, setBasicExpanded] = useState(true);
    const [personalityExpanded, setPersonalityExpanded] = useState(true);
    const [voiceExpanded, setVoiceExpanded] = useState(false);
    const [knowledgeExpanded, setKnowledgeExpanded] = useState(false);
    const [privacyExpanded, setPrivacyExpanded] = useState(false);
    const [advancedExpanded, setAdvancedExpanded] = useState(false);

    // Character Bible fields
    const [character, setCharacter] = useState<Partial<CharacterBible>>({
        ...DEFAULT_CHARACTER_BIBLE,
        role: 'protagonist',
        importance: 'core',
    });

    const updateField = (field: keyof CharacterBible, value: any) => {
        setCharacter(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (finish: boolean) => {
        if (!character.name || !character.backstory) {
            Alert.alert("Missing Info", "Please enter at least a name and backstory.");
            return;
        }

        setLoading(true);
        console.log("Saving character bible...", { finish });

        try {
            if (!user) {
                Alert.alert("Error", "You must be logged in.");
                return;
            }

            // Parse comma-separated strings into arrays
            const traitsArray = character.traits || [];
            const emotionalBoundariesArray = typeof character.emotionalBoundaries === 'string'
                ? (character.emotionalBoundaries as string).split(',').map(s => s.trim()).filter(Boolean)
                : character.emotionalBoundaries || [];

            const docReference = await addDoc(collection(db, "characters"), {
                ...character,
                bookId,
                authorId: user.uid,
                traits: traitsArray,
                emotionalBoundaries: emotionalBoundariesArray,
                createdAt: new Date()
            });
            console.log("Character saved with ID:", docReference.id);

            if (finish) {
                console.log("Finishing... Clearing stack and redirecting to Dashboard");
                if (router.canGoBack()) {
                    router.dismissAll();
                }
                router.replace('/dashboard/author');
            } else {
                console.log("Adding another...");
                setCharacter({
                    ...DEFAULT_CHARACTER_BIBLE,
                    role: 'protagonist',
                    importance: 'core',
                });
                Alert.alert("Success", "Character saved! Add another one.");
            }
        } catch (e: any) {
            console.error("Error adding character: ", e);
            Alert.alert("Error", "Failed to save character: " + e.message);
        } finally {
            setLoading(false);
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

    const RoleButton = ({ value, label }: { value: string; label: string }) => (
        <TouchableOpacity
            style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: character.role === value ? Colors.classic.primary : '#eee',
            }}
            onPress={() => updateField('role', value)}
        >
            <Text style={{ color: character.role === value ? 'white' : Colors.classic.text }}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20 }}>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={{ fontFamily: 'Outfit_500Medium', color: Colors.classic.textSecondary }}>Log Out</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Create Character</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>
                    Define who this character is and how they behave
                </Text>

                <View style={[GlobalStyles.card, { borderColor: Colors.classic.border, backgroundColor: Colors.classic.surface }]}>

                    {/* BASIC INFO */}
                    <CollapsibleSection
                        title="📋 Basic Info"
                        expanded={basicExpanded}
                        onToggle={() => setBasicExpanded(!basicExpanded)}
                    >
                        <Text style={styles.label}>Character Name *</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. Liora Vent"
                            placeholderTextColor="#999"
                            value={character.name || ''}
                            onChangeText={(v) => updateField('name', v)}
                        />

                        <Text style={styles.label}>Role in Story</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
                            <RoleButton value="protagonist" label="Protagonist" />
                            <RoleButton value="antagonist" label="Antagonist" />
                            <RoleButton value="supporting" label="Supporting" />
                            <RoleButton value="peripheral" label="Peripheral" />
                        </View>

                        <Text style={styles.label}>Backstory *</Text>
                        <TextInput
                            style={[GlobalStyles.input, { height: 100, textAlignVertical: 'top' }]}
                            placeholder="Where do they come from? What drives them?"
                            multiline
                            value={character.backstory || ''}
                            onChangeText={(v) => updateField('backstory', v)}
                        />
                    </CollapsibleSection>

                    {/* PERSONALITY */}
                    <CollapsibleSection
                        title="💭 Personality"
                        expanded={personalityExpanded}
                        onToggle={() => setPersonalityExpanded(!personalityExpanded)}
                    >
                        <Text style={styles.label}>Personality Traits (comma separated)</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. curious, guarded, playful"
                            value={Array.isArray(character.traits) ? character.traits.join(', ') : ''}
                            onChangeText={(v) => updateField('traits', v.split(',').map(s => s.trim()).filter(Boolean))}
                        />

                        <Text style={styles.label}>Emotional Baseline</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. calm but anxious underneath"
                            value={character.emotionalBaseline || ''}
                            onChangeText={(v) => updateField('emotionalBaseline', v)}
                        />

                        <Text style={styles.label}>Emotional Boundaries (topics that upset them)</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. family loss, the war"
                            value={Array.isArray(character.emotionalBoundaries) ? character.emotionalBoundaries.join(', ') : ''}
                            onChangeText={(v) => updateField('emotionalBoundaries', v)}
                        />
                    </CollapsibleSection>

                    {/* VOICE */}
                    <CollapsibleSection
                        title="🗣️ Voice"
                        expanded={voiceExpanded}
                        onToggle={() => setVoiceExpanded(!voiceExpanded)}
                    >
                        <Text style={styles.label}>Speaking Style</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. formal, poetic, casual"
                            value={character.speakingStyle || ''}
                            onChangeText={(v) => updateField('speakingStyle', v)}
                        />

                        <Text style={styles.label}>Linguistic Quirks</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. uses mechanical metaphors, pauses often"
                            value={character.linguisticQuirks || ''}
                            onChangeText={(v) => updateField('linguisticQuirks', v)}
                        />
                    </CollapsibleSection>

                    {/* KNOWLEDGE BOUNDARIES */}
                    <CollapsibleSection
                        title="📚 Knowledge Boundaries"
                        expanded={knowledgeExpanded}
                        onToggle={() => setKnowledgeExpanded(!knowledgeExpanded)}
                    >
                        <Text style={styles.label}>Things They Definitely Know</Text>
                        <TextInput
                            style={[GlobalStyles.input, { height: 60, textAlignVertical: 'top' }]}
                            placeholder="e.g. how the clockwork orchard works, family history"
                            multiline
                            value={Array.isArray(character.definitelyKnows) ? character.definitelyKnows.join(', ') : ''}
                            onChangeText={(v) => updateField('definitelyKnows', v.split(',').map(s => s.trim()).filter(Boolean))}
                        />

                        <Text style={styles.label}>Things They Don't Know</Text>
                        <TextInput
                            style={[GlobalStyles.input, { height: 60, textAlignVertical: 'top' }]}
                            placeholder="e.g. the villain's true identity, what happens in chapter 10"
                            multiline
                            value={Array.isArray(character.doesNotKnow) ? character.doesNotKnow.join(', ') : ''}
                            onChangeText={(v) => updateField('doesNotKnow', v.split(',').map(s => s.trim()).filter(Boolean))}
                        />

                        <Text style={styles.label}>Anchored at Chapter</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="1"
                            keyboardType="numeric"
                            value={String(character.anchoredChapter || 1)}
                            onChangeText={(v) => updateField('anchoredChapter', parseInt(v) || 1)}
                        />
                    </CollapsibleSection>

                    {/* PRIVACY RULES */}
                    <CollapsibleSection
                        title="🔒 Privacy Rules"
                        expanded={privacyExpanded}
                        onToggle={() => setPrivacyExpanded(!privacyExpanded)}
                    >
                        <Text style={styles.label}>Topics They Avoid</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. their mother's death, the accident"
                            value={Array.isArray(character.avoidsTopics) ? character.avoidsTopics.join(', ') : ''}
                            onChangeText={(v) => updateField('avoidsTopics', v.split(',').map(s => s.trim()).filter(Boolean))}
                        />

                        <Text style={styles.label}>Information They Withhold</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. plot spoilers, their secret identity"
                            value={Array.isArray(character.withholdsInfo) ? character.withholdsInfo.join(', ') : ''}
                            onChangeText={(v) => updateField('withholdsInfo', v.split(',').map(s => s.trim()).filter(Boolean))}
                        />

                        <Text style={styles.label}>When They Open Up</Text>
                        <TextInput
                            style={GlobalStyles.input}
                            placeholder="e.g. after trust is established"
                            value={character.opensUpWhen || ''}
                            onChangeText={(v) => updateField('opensUpWhen', v)}
                        />
                    </CollapsibleSection>

                    {/* ADVANCED */}
                    <CollapsibleSection
                        title="⚙️ Advanced"
                        expanded={advancedExpanded}
                        onToggle={() => setAdvancedExpanded(!advancedExpanded)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <TouchableOpacity
                                onPress={() => updateField('canEvolve', !character.canEvolve)}
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 4,
                                    borderWidth: 2,
                                    borderColor: Colors.classic.primary,
                                    backgroundColor: character.canEvolve ? Colors.classic.primary : 'transparent',
                                    marginRight: 10,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                {character.canEvolve && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}
                            </TouchableOpacity>
                            <Text style={{ color: Colors.classic.text }}>Character can evolve over time</Text>
                        </View>

                        {character.canEvolve && (
                            <>
                                <Text style={styles.label}>Type of Evolution</Text>
                                <TextInput
                                    style={GlobalStyles.input}
                                    placeholder="e.g. emotional depth, trust building"
                                    value={character.evolutionType || ''}
                                    onChangeText={(v) => updateField('evolutionType', v)}
                                />
                            </>
                        )}
                    </CollapsibleSection>

                </View>

                <View style={{ gap: 10, marginBottom: 40 }}>
                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: Colors.classic.secondary }]}
                        onPress={() => handleSave(false)}
                        disabled={loading}
                    >
                        <Text style={[GlobalStyles.buttonText, { color: Colors.classic.primary }]}>{loading ? "Saving..." : "Save & Add Another"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary }]}
                        onPress={() => handleSave(true)}
                        disabled={loading}
                    >
                        <Text style={GlobalStyles.buttonText}>{loading ? "Saving..." : "Save & Finish"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = {
    label: {
        marginBottom: 8,
        fontWeight: '600' as '600',
        color: Colors.classic.text,
        fontSize: 14,
    }
};
