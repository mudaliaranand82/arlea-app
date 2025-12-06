import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function AuthorWelcome() {
    return (
        <SafeAreaView style={GlobalStyles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Text style={[GlobalStyles.title, { color: Colors.author.primary }]}>Welcome, Author!</Text>
                <Text style={GlobalStyles.subtitle}>
                    Turn your book into an interactive experience. Connect with your readers in a whole new way.
                </Text>

                <View style={GlobalStyles.card}>
                    <Text style={{ fontSize: 16, marginBottom: 10, lineHeight: 24 }}>
                        1. <Text style={{ fontWeight: 'bold' }}>Upload</Text> your book details
                    </Text>
                    <Text style={{ fontSize: 16, marginBottom: 10, lineHeight: 24 }}>
                        2. <Text style={{ fontWeight: 'bold' }}>Create</Text> character profiles
                    </Text>
                    <Text style={{ fontSize: 16, marginBottom: 10, lineHeight: 24 }}>
                        3. <Text style={{ fontWeight: 'bold' }}>Launch</Text> your interactive world
                    </Text>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.author.primary, marginTop: 30 }]}
                    onPress={() => router.push('/onboarding/author/book-info')}
                >
                    <Text style={GlobalStyles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
