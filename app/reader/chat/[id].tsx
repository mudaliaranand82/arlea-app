import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EvalReportCard, EvalResult } from '../../../components/EvalReportCard';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';
import { auth, db, functions } from '../../../firebaseConfig';
import { ChatService } from '../../../services/ChatService';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'character';
};

// Typing indicator with animated dots
const TypingIndicator = ({ characterName }: { characterName: string }) => (
    <View style={{
        alignSelf: 'flex-start',
        backgroundColor: Colors.classic.surface,
        padding: 14,
        paddingHorizontal: 18,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.classic.border,
        maxWidth: '80%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
            {[0, 1, 2].map(i => (
                <View key={i} style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.classic.primary,
                    opacity: 0.6
                }} />
            ))}
        </View>
        <Text style={{ fontSize: 12, color: Colors.classic.textSecondary, fontStyle: 'italic' }}>
            {characterName} is typing...
        </Text>
    </View>
);

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [character, setCharacter] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Eval State
    const [evalModalVisible, setEvalModalVisible] = useState(false);
    const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
    const [evalLoading, setEvalLoading] = useState(false);

    const handleRunEval = async () => {
        if (!character) return;
        setEvalLoading(true);
        setEvalModalVisible(true);
        // Clear previous result if re-running
        if (evalResult) setEvalResult(null);

        try {
            // Format messages for backend
            const conversationHistory = messages
                .filter(m => m.id !== 'init')
                .map(m => ({
                    sender: m.sender,
                    text: m.text
                }));

            const evaluateConversation = httpsCallable(functions, 'evaluateCurrentConversation');
            const result = await evaluateConversation({
                characterId: character.id || id, // id from params is doc id
                conversationHistory
            });

            setEvalResult(result.data as EvalResult);
        } catch (error) {
            console.error("Eval failed:", error);
            alert("Failed to run evaluation. See console.");
            setEvalModalVisible(false);
        } finally {
            setEvalLoading(false);
        }
    };

    useEffect(() => {
        const fetchCharacter = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "characters", id as string);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const charData = snap.data();
                    setCharacter(charData);

                    // Dynamic, engaging greeting based on character
                    const greetings = [
                        `*${charData.name} notices you and turns to face you with curiosity.*`,
                        `*${charData.name} looks up, meeting your gaze.*`,
                        `*${charData.name} pauses, sensing your presence.*`
                    ];
                    const greeting = {
                        id: 'init',
                        text: greetings[Math.floor(Math.random() * greetings.length)],
                        sender: 'character' as const
                    };
                    setMessages([greeting]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchCharacter();
    }, [id]);

    const handleSend = async () => {
        if (!message.trim() || typing) return;

        const userMessage = message.trim();
        const updatedMessages = [...messages, { id: Date.now().toString(), text: userMessage, sender: 'user' as const }];
        setMessages(updatedMessages);
        setMessage('');
        setTyping(true);

        // Scroll to bottom after adding message
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const history = messages.filter(m => m.id !== 'init').map(m => ({
                role: (m.sender === 'user' ? 'user' : 'model') as "user" | "model",
                parts: [{ text: m.text }]
            }));

            const responseText = await ChatService.sendMessage(
                userMessage,
                character.bookId,
                id as string,
                history
            );

            setMessages(prev => [...prev, { id: Date.now().toString(), text: responseText, sender: 'character' as const }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "*appears momentarily distracted* I beg your pardon, I seem to have lost my train of thought. Could you repeat that?",
                sender: 'character' as const
            }]);
        } finally {
            setTyping(false);
        }
    };

    // Handle Enter key to send (web and desktop)
    const handleKeyPress = (e: any) => {
        // Check for Enter without Shift (Shift+Enter for new line)
        if (e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
            e.preventDefault?.();
            handleSend();
        }
    };

    if (loading) {
        return (
            <View style={[GlobalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.classic.primary} />
                <Text style={{ marginTop: 10, color: Colors.classic.textSecondary }}>Loading character...</Text>
            </View>
        );
    }

    if (!character) {
        return (
            <View style={[GlobalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: Colors.classic.textSecondary }}>Character not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 15 }}>
                    <Text style={{ color: Colors.classic.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            {/* Header */}
            <View style={{
                padding: 15,
                borderBottomWidth: 1,
                borderColor: Colors.classic.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'white'
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15, padding: 4 }}>
                        <Ionicons name="arrow-back" size={24} color={Colors.classic.text} />
                    </TouchableOpacity>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: Colors.classic.secondary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10
                    }}>
                        <Text style={{ fontSize: 18 }}>👤</Text>
                    </View>
                    <View>
                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 17, color: Colors.classic.text }}>{character.name}</Text>
                        <Text style={{ fontSize: 12, color: Colors.classic.textSecondary }}>{character.role}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleRunEval} style={{ padding: 8, marginRight: 8, backgroundColor: Colors.classic.secondary, borderRadius: 8 }}>
                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12 }}>Eval</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={async () => {
                            await signOut(auth);
                            router.replace('/');
                        }}
                        style={{ padding: 8 }}
                    >
                        <Ionicons name="log-out-outline" size={22} color={Colors.classic.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Chat Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 15, paddingBottom: 10 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListFooterComponent={typing ? <View style={{ marginTop: 12 }}><TypingIndicator characterName={character.name} /></View> : null}
                    renderItem={({ item }) => (
                        <View style={{
                            alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                            backgroundColor: item.sender === 'user' ? Colors.classic.primary : Colors.classic.surface,
                            padding: 14,
                            borderRadius: 18,
                            maxWidth: '80%',
                            borderBottomRightRadius: item.sender === 'user' ? 4 : 18,
                            borderBottomLeftRadius: item.sender === 'character' ? 4 : 18,
                            borderWidth: item.sender === 'character' ? 1 : 0,
                            borderColor: Colors.classic.border,
                            // Subtle shadow for depth
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1
                        }}>
                            <Text style={{
                                color: item.sender === 'user' ? 'white' : Colors.classic.text,
                                fontFamily: 'Outfit_400Regular',
                                fontSize: 15,
                                lineHeight: 22
                            }}>{item.text}</Text>
                        </View>
                    )}
                />

                {/* Input Area */}
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={10}>
                    <View style={{
                        flexDirection: 'row',
                        padding: 12,
                        paddingHorizontal: 16,
                        borderTopWidth: 1,
                        borderColor: Colors.classic.border,
                        backgroundColor: 'white',
                        alignItems: 'center',
                    }}>
                        <TextInput
                            style={{
                                flex: 1,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 22,
                                paddingHorizontal: 16,
                                paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                                fontFamily: 'Outfit_400Regular',
                                fontSize: 15,
                                maxHeight: 100,
                                minHeight: 44,
                                borderWidth: 1,
                                borderColor: '#e0e0e0',
                            }}
                            placeholder="Type your message..."
                            placeholderTextColor="#999"
                            value={message}
                            onChangeText={setMessage}
                            onKeyPress={handleKeyPress}
                            multiline
                            blurOnSubmit={false}
                            returnKeyType="default"
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!message.trim() || typing}
                            style={{
                                backgroundColor: message.trim() && !typing ? Colors.classic.primary : '#ddd',
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginLeft: 10,
                            }}
                        >
                            <Ionicons name="send" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                {/* Eval Modal */}
                <Modal
                    visible={evalModalVisible}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setEvalModalVisible(false)}
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18 }}>Evaluator</Text>
                            <TouchableOpacity onPress={() => setEvalModalVisible(false)} style={{ padding: 8 }}>
                                <Text style={{ fontFamily: 'Outfit_500Medium', color: Colors.classic.primary, fontSize: 16 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <EvalReportCard
                                evalResult={evalResult}
                                loading={evalLoading}
                                onRunEval={handleRunEval}
                            />
                        </ScrollView>
                    </SafeAreaView>
                </Modal>
        </SafeAreaView>
    );
}
