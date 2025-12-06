import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Theme';
import { auth, db } from '../../firebaseConfig';
import { AIService } from '../../services/aiService';

export default function ChatScreen() {
    const { id } = useLocalSearchParams(); // Book ID

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [character, setCharacter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        const fetchContext = async () => {
            if (!auth.currentUser || !id) return;

            // 1. Find the character associated with this book
            const q = query(collection(db, "characters"), where("bookId", "==", id));
            const charSnapshot = await getDocs(q);

            if (!charSnapshot.empty) {
                // For MVP, just take the first character found for this book
                const charData = { id: charSnapshot.docs[0].id, ...charSnapshot.docs[0].data() };
                setCharacter(charData);

                // 2. Listen to Messages
                const chatId = `${auth.currentUser.uid}_${charData.id}`;
                const msgQuery = query(
                    collection(db, "messages"),
                    where("chatId", "==", chatId),
                    orderBy("createdAt", "asc")
                );

                const unsubscribe = onSnapshot(msgQuery, (snapshot) => {
                    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMessages(msgs);
                    setLoading(false);
                    // Scroll to bottom
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                });

                return unsubscribe;
            } else {
                setLoading(false);
            }
        };

        fetchContext();
    }, [id]);

    const handleSend = async () => {
        if (!message.trim() || !auth.currentUser || !character) return;

        const text = message.trim();
        setMessage('');
        setSending(true);

        try {
            const chatId = `${auth.currentUser.uid}_${character.id}`;

            // 1. Save User Message
            await addDoc(collection(db, "messages"), {
                text: text,
                senderId: auth.currentUser.uid,
                userId: auth.currentUser.uid,
                characterId: character.id,
                bookId: id,
                chatId: chatId,
                createdAt: new Date()
            });

            // 2. Trigger AI
            await AIService.sendMessage(text, id as string, character.id, auth.currentUser.uid);

        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <SafeAreaView style={GlobalStyles.container}><Text>Loading...</Text></SafeAreaView>;
    if (!character) return <SafeAreaView style={GlobalStyles.container}><Text>No character found. Please create one first.</Text></SafeAreaView>;

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.reader.background }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                    <Text style={{ fontSize: 24 }}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={[GlobalStyles.title, { marginBottom: 0, fontSize: 18 }]}>{character.name}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>{character.role}</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, paddingVertical: 10 }}
                contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            >
                {messages.map((msg) => {
                    const isUser = msg.senderId === auth.currentUser?.uid;
                    return (
                        <View
                            key={msg.id}
                            style={{
                                alignSelf: isUser ? 'flex-end' : 'flex-start',
                                backgroundColor: isUser ? Colors.reader.primary : 'white',
                                padding: 12,
                                borderRadius: 12,
                                maxWidth: '80%',
                                borderBottomRightRadius: isUser ? 0 : 12,
                                borderBottomLeftRadius: isUser ? 12 : 0,
                                shadowColor: '#000',
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 1
                            }}
                        >
                            <Text style={{ color: isUser ? 'white' : 'black' }}>{msg.text}</Text>
                        </View>
                    );
                })}
                {sending && (
                    <View style={{ alignSelf: 'flex-start', padding: 10 }}>
                        <Text style={{ color: '#999', fontStyle: 'italic' }}>{character.name} is typing...</Text>
                    </View>
                )}
            </ScrollView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
                <View style={{ flexDirection: 'row', gap: 10, paddingTop: 10 }}>
                    <TextInput
                        style={[GlobalStyles.input, { flex: 1, marginBottom: 0, backgroundColor: 'white' }]}
                        placeholder="Type a message..."
                        value={message}
                        onChangeText={setMessage}
                    />
                    <TouchableOpacity
                        style={[GlobalStyles.button, { width: 50, backgroundColor: Colors.reader.primary, marginBottom: 0 }]}
                        onPress={handleSend}
                        disabled={sending}
                    >
                        <Text style={GlobalStyles.buttonText}>↑</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
