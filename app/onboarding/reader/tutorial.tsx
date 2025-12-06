import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function ReaderTutorial() {
    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.reader.background }]}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Text style={[GlobalStyles.title, { color: Colors.reader.text }]}>How to Chat</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.reader.text }]}>
                    It's easy! Just type a message to talk to any character.
                </Text>

                <View style={GlobalStyles.card}>
                    <Text style={{ fontSize: 16, marginBottom: 15 }}>
                        👋 <Text style={{ fontWeight: 'bold' }}>Say Hello</Text> to start the conversation.
                    </Text>
                    <Text style={{ fontSize: 16, marginBottom: 15 }}>
                        ❓ <Text style={{ fontWeight: 'bold' }}>Ask Questions</Text> about their life.
                    </Text>
                    <Text style={{ fontSize: 16 }}>
                        🤐 <Text style={{ fontWeight: 'bold' }}>Be Safe</Text> - keep it friendly!
                    </Text>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.reader.primary, marginTop: 30 }]}
                    onPress={() => router.replace('/dashboard/reader')}
                >
                    <Text style={GlobalStyles.buttonText}>I'm Ready!</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
