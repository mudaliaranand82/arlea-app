import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EvalReportCard, EvalResult } from '../../../components/EvalReportCard';
import { DesignTokens } from '../../../constants/DesignSystem';
import { auth, db, functions } from '../../../firebaseConfig';
import { ChatService } from '../../../services/ChatService';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'character';
};

// Animated typing dots
function TypingDot({ delay }: { delay: number }) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.typingDot, animStyle, { marginLeft: delay > 0 ? 4 : 0 }]} />
    );
}

// Typing indicator component
function TypingIndicator({ characterName }: { characterName: string }) {
    return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.typingContainer}>
            <View style={styles.typingDots}>
                <TypingDot delay={0} />
                <TypingDot delay={100} />
                <TypingDot delay={200} />
            </View>
            <Text style={styles.typingText}>{characterName} is composing...</Text>
        </Animated.View>
    );
}

// Message bubble component
function MessageBubble({ message, characterName }: { message: Message; characterName: string }) {
    const isUser = message.sender === 'user';

    return (
        <Animated.View
            entering={isUser ? FadeInUp.duration(300) : FadeInDown.duration(300)}
            style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.characterBubble,
            ]}
        >
            {!isUser && (
                <View style={styles.characterLabel}>
                    <Text style={styles.characterLabelText}>{characterName}</Text>
                </View>
            )}
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                {message.text}
            </Text>
        </Animated.View>
    );
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [character, setCharacter] = useState<any>(null);
    const [book, setBook] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
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
            // Start from latest back to earliest (or backend handles order? usually list is cronological)
            // Local messages are cronological.
            // Filter out init message if needed, or include it.
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

                    // Fetch book info
                    if (charData.bookId) {
                        const bookRef = doc(db, "books", charData.bookId);
                        const bookSnap = await getDoc(bookRef);
                        if (bookSnap.exists()) {
                            setBook(bookSnap.data());
                        }
                    }

                    // Dynamic greeting
                    const greetings = [
                        `*${charData.name} notices your presence and turns with quiet curiosity.*`,
                        `*${charData.name} looks up from their thoughts, acknowledging you with a subtle nod.*`,
                        `*A moment passes before ${charData.name} speaks, their gaze meeting yours.*`,
                    ];
                    const greeting = {
                        id: 'init',
                        text: greetings[Math.floor(Math.random() * greetings.length)],
                        sender: 'character' as const,
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
        const updatedMessages = [
            ...messages,
            { id: Date.now().toString(), text: userMessage, sender: 'user' as const },
        ];
        setMessages(updatedMessages);
        setMessage('');
        setTyping(true);

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const history = messages
                .filter((m) => m.id !== 'init')
                .map((m) => ({
                    role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
                    parts: [{ text: m.text }],
                }));

            const responseText = await ChatService.sendMessage(
                userMessage,
                character.bookId,
                id as string,
                history
            );

            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), text: responseText, sender: 'character' as const },
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    text: '*appears momentarily distracted* I beg your pardon, I seem to have lost my train of thought. Could you repeat that?',
                    sender: 'character' as const,
                },
            ]);
        } finally {
            setTyping(false);
        }
    };

    const handleKeyPress = (e: any) => {
        if (e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
            e.preventDefault?.();
            handleSend();
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient
                    colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.loadingContent}>
                    <Text style={styles.loadingOrnament}>~</Text>
                    <ActivityIndicator size="large" color={DesignTokens.colors.accent} />
                    <Text style={styles.loadingText}>Entering the story...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!character) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <LinearGradient
                    colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.loadingContent}>
                    <Text style={styles.errorOrnament}>"</Text>
                    <Text style={styles.errorTitle}>Character not found</Text>
                    <Text style={styles.errorText}>This character may have been removed.</Text>
                    <Pressable onPress={() => router.back()} style={styles.backLink}>
                        <Text style={styles.backLinkText}>Return to stories</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={[DesignTokens.colors.background, DesignTokens.colors.backgroundAlt]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backArrow}>{'<'}</Text>
                </Pressable>

                <View style={styles.headerCenter}>
                    <View style={styles.characterAvatar}>
                        <Text style={styles.characterAvatarText}>
                            {character.name?.[0]?.toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.characterName}>{character.name}</Text>
                        <Text style={styles.characterMeta}>
                            {character.role} {book?.title ? `· ${book.title}` : ''}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerButtons}>
                    <Pressable
                        onPress={handleRunEval}
                        style={styles.evalButton}
                    >
                        <Text style={styles.evalButtonText}>Eval</Text>
                    </Pressable>
                    <Pressable
                        onPress={async () => {
                            await signOut(auth);
                            router.replace('/');
                        }}
                        style={styles.headerAction}
                    >
                        <Text style={styles.headerActionText}>Exit</Text>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Chat Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListHeaderComponent={() => (
                    <View style={styles.conversationStart}>
                        <View style={styles.ornamentLine} />
                        <Text style={styles.conversationStartText}>Conversation begins</Text>
                        <View style={styles.ornamentLine} />
                    </View>
                )}
                ListFooterComponent={
                    typing ? (
                        <View style={{ marginTop: 16 }}>
                            <TypingIndicator characterName={character.name} />
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <MessageBubble message={item} characterName={character.name} />
                )}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={10}
            >
                <Animated.View entering={FadeInUp.duration(400)} style={styles.inputContainer}>
                    <View
                        style={[
                            styles.inputWrapper,
                            inputFocused && styles.inputWrapperFocused,
                        ]}
                    >
                        <TextInput
                            style={styles.textInput}
                            placeholder="Write your message..."
                            placeholderTextColor={DesignTokens.colors.textMuted}
                            value={message}
                            onChangeText={setMessage}
                            onKeyPress={handleKeyPress}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            multiline
                            blurOnSubmit={false}
                            returnKeyType="default"
                        />
                        <Pressable
                            onPress={handleSend}
                            disabled={!message.trim() || typing}
                            style={[
                                styles.sendButton,
                                (!message.trim() || typing) && styles.sendButtonDisabled,
                            ]}
                        >
                            <Text style={styles.sendButtonText}>{'>'}</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.inputHint}>Press Enter to send</Text>
                </Animated.View>
            </KeyboardAvoidingView>

            {/* Eval Modal */}
            <Modal
                visible={evalModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setEvalModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Evaluator</Text>
                        <Pressable onPress={() => setEvalModalVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <EvalReportCard
                            evalResult={evalResult}
                            loading={evalLoading}
                            onRunEval={handleRunEval}
                        />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 48,
        color: DesignTokens.colors.accent,
        marginBottom: 20,
    },
    loadingText: {
        fontFamily: 'Lora-Italic',
        fontSize: 16,
        color: DesignTokens.colors.textSecondary,
        marginTop: 16,
    },
    errorOrnament: {
        fontFamily: 'PlayfairDisplay-Italic',
        fontSize: 60,
        color: DesignTokens.colors.accent,
        opacity: 0.3,
        marginBottom: 12,
    },
    errorTitle: {
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 22,
        color: DesignTokens.colors.text,
        marginBottom: 8,
    },
    errorText: {
        fontFamily: 'Lora',
        fontSize: 15,
        color: DesignTokens.colors.textMuted,
        marginBottom: 24,
    },
    backLink: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: DesignTokens.colors.accent,
        borderRadius: DesignTokens.radius.md,
    },
    backLinkText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 14,
        color: DesignTokens.colors.textOnAccent,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: DesignTokens.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: DesignTokens.colors.border,
        ...DesignTokens.shadows.subtle,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DesignTokens.colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontFamily: 'Lora',
        fontSize: 20,
        color: DesignTokens.colors.textSecondary,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    characterAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: DesignTokens.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    characterAvatarText: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 18,
        color: DesignTokens.colors.textOnDark,
    },
    headerInfo: {
        flex: 1,
    },
    characterName: {
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 17,
        color: DesignTokens.colors.text,
    },
    characterMeta: {
        fontFamily: 'Lora',
        fontSize: 12,
        color: DesignTokens.colors.textMuted,
        marginTop: 2,
    },
    headerAction: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    headerActionText: {
        fontFamily: 'Raleway-Medium',
        fontSize: 13,
        color: DesignTokens.colors.textMuted,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    evalButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: DesignTokens.colors.primary, // Or maybe an outlined style? Primary stands out.
        borderRadius: 6,
    },
    evalButtonText: {
        fontFamily: 'Outfit_700Bold', // Using Outfit as in EvalReportCard for consistency
        fontSize: 12,
        color: DesignTokens.colors.textOnDark,
        letterSpacing: 0.5,
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 18,
        color: DesignTokens.colors.text,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: DesignTokens.colors.primary,
    },
    modalContent: {
        padding: 20,
    },

    // Messages
    messagesList: {
        padding: 20,
        paddingBottom: 16,
    },
    conversationStart: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 12,
    },
    ornamentLine: {
        flex: 1,
        height: 1,
        backgroundColor: DesignTokens.colors.border,
        maxWidth: 60,
    },
    conversationStartText: {
        fontFamily: 'Lora-Italic',
        fontSize: 12,
        color: DesignTokens.colors.textMuted,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 16,
        borderRadius: DesignTokens.radius.lg,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: DesignTokens.colors.primary,
        borderBottomRightRadius: 4,
        ...DesignTokens.shadows.soft,
    },
    characterBubble: {
        alignSelf: 'flex-start',
        backgroundColor: DesignTokens.colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        ...DesignTokens.shadows.subtle,
    },
    characterLabel: {
        marginBottom: 8,
    },
    characterLabelText: {
        fontFamily: 'Raleway-SemiBold',
        fontSize: 11,
        color: DesignTokens.colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    messageText: {
        fontFamily: 'Lora',
        fontSize: 15,
        color: DesignTokens.colors.text,
        lineHeight: 24,
    },
    userMessageText: {
        color: DesignTokens.colors.textOnDark,
    },

    // Typing Indicator
    typingContainer: {
        alignSelf: 'flex-start',
        backgroundColor: DesignTokens.colors.surface,
        padding: 14,
        paddingHorizontal: 18,
        borderRadius: DesignTokens.radius.lg,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    typingDots: {
        flexDirection: 'row',
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: DesignTokens.colors.accent,
    },
    typingText: {
        fontFamily: 'Lora-Italic',
        fontSize: 13,
        color: DesignTokens.colors.textMuted,
    },

    // Input
    inputContainer: {
        padding: 16,
        paddingTop: 12,
        backgroundColor: DesignTokens.colors.surface,
        borderTopWidth: 1,
        borderTopColor: DesignTokens.colors.border,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: DesignTokens.colors.backgroundAlt,
        borderRadius: DesignTokens.radius.xl,
        borderWidth: 1,
        borderColor: DesignTokens.colors.border,
        paddingLeft: 18,
        paddingRight: 6,
        paddingVertical: 6,
    },
    inputWrapperFocused: {
        borderColor: DesignTokens.colors.accent,
    },
    textInput: {
        flex: 1,
        fontFamily: 'Lora',
        fontSize: 15,
        color: DesignTokens.colors.text,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        maxHeight: 120,
        minHeight: 40,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DesignTokens.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: DesignTokens.colors.border,
    },
    sendButtonText: {
        fontFamily: 'Lora-Bold',
        fontSize: 18,
        color: DesignTokens.colors.textOnAccent,
    },
    inputHint: {
        fontFamily: 'Raleway',
        fontSize: 11,
        color: DesignTokens.colors.textMuted,
        textAlign: 'center',
        marginTop: 8,
    },
});
