import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';
import { db } from '../../firebaseConfig';
import { generateCharacterResponse } from '../../services/ai';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'character';
};

export default function ChatScreen() {
    const { id } = useLocalSearchParams(); // Character ID
    const router = useRouter();
    const [character, setCharacter] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const fetchCharacter = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "characters", id as string);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setCharacter(snap.data());

                    // Initial Greeting
                    const charData = snap.data();
                    const greeting = {
                        id: 'init',
                        text: `*${charData.name} looks at you matches your gaze.*`,
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

        const updatedMessages = [...messages, { id: Date.now().toString(), text: message, sender: 'user' as const }];
        setMessages(updatedMessages);
        setMessage('');
        setTyping(true);

        try {
            // Convert app history to Gemini history format
            const history = messages.filter(m => m.id !== 'init').map(m => ({
                role: m.sender === 'user' ? 'user' : 'model' as const,
                parts: [{ text: m.text }]
            }));

            const responseText = await generateCharacterResponse(
                character.name,
                character.personality,
                character.backstory,
                character.speakingStyle,
                message,
                history
            );

            setMessages(prev => [...prev, { id: Date.now().toString(), text: responseText, sender: 'character' as const }]);
        } catch (error) {
            console.error(error);
        } finally {
            setTyping(false);
        }
    };

    if (loading) return <View style={GlobalStyles.container}><ActivityIndicator /></View>;

    if (!character) return <View style={GlobalStyles.container}><Text>Character not found</Text></View>;

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            {/* Header */}
            <View style={{ padding: 15, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.classic.text} />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: Colors.classic.text }}>{character.name}</Text>
                    <Text style={{ fontSize: 12, color: Colors.classic.textSecondary }}>{character.role}</Text>
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 15, gap: 15 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                    <View style={{
                        alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: item.sender === 'user' ? Colors.classic.primary : Colors.classic.surface,
                        padding: 12,
                        borderRadius: 16,
                        maxWidth: '80%',
                        borderBottomRightRadius: item.sender === 'user' ? 2 : 16,
                        borderBottomLeftRadius: item.sender === 'character' ? 2 : 16,
                        borderWidth: item.sender === 'character' ? 1 : 0,
                        borderColor: '#eee'
                    }}>
                        <Text style={{
                            color: item.sender === 'user' ? 'white' : Colors.classic.text,
                            fontFamily: 'Outfit_400Regular',
                            fontSize: 16
                        }}>{item.text}</Text>
                    </View>
                )}
            />

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={10}>
                <View style={{ flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#eee', backgroundColor: 'white' }}>
                    <TextInput
                        style={{
                            flex: 1,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 20,
                            paddingHorizontal: 15,
                            paddingVertical: 10,
                            fontFamily: 'Outfit_400Regular',
                            marginRight: 10,
                            maxHeight: 100
                        }}
                        placeholder={typing ? "Character is typing..." : "Type a message..."}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!message.trim() || typing}
                        style={{
                            backgroundColor: message.trim() ? Colors.classic.primary : '#ccc',
                            width: 44, height: 44, borderRadius: 22,
                            justifyContent: 'center', alignItems: 'center'
                        }}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
