import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function AuthorWelcome() {
    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Welcome, Author!</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>
                    Turn your book into an interactive experience. Connect with your readers in a whole new way.
                </Text>

                <View style={[GlobalStyles.card, { borderColor: Colors.classic.border, backgroundColor: Colors.classic.surface }]}>
                    <Text style={{ fontSize: 16, marginBottom: 10, lineHeight: 24, color: Colors.classic.text, fontFamily: 'Outfit_400Regular' }}>
                        1. <Text style={{ fontFamily: 'Outfit_700Bold', color: Colors.classic.primary }}>Upload</Text> your book details
                    </Text>
                    <Text style={{ fontSize: 16, marginBottom: 10, lineHeight: 24, color: Colors.classic.text, fontFamily: 'Outfit_400Regular' }}>
                        2. <Text style={{ fontFamily: 'Outfit_700Bold', color: Colors.classic.primary }}>Create</Text> character profiles
                    </Text>
                    <Text style={{ fontSize: 16, marginBottom: 10, lineHeight: 24, color: Colors.classic.text, fontFamily: 'Outfit_400Regular' }}>
                        3. <Text style={{ fontFamily: 'Outfit_700Bold', color: Colors.classic.primary }}>Launch</Text> your interactive world
                    </Text>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary, marginTop: 30 }]}
                    onPress={() => router.push('/onboarding/author/book-info')}
                >
                    <Text style={GlobalStyles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
