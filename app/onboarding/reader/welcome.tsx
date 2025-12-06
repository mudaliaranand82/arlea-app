import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function ReaderWelcome() {
    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.reader.background }]}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Text style={[GlobalStyles.title, { color: Colors.reader.text }]}>Welcome to Arlea!</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.reader.text }]}>
                    Step into your favorite books and chat with the characters you love.
                </Text>

                <View style={GlobalStyles.card}>
                    <Text style={{ fontSize: 16, marginBottom: 10 }}>✨ Meet your heroes</Text>
                    <Text style={{ fontSize: 16, marginBottom: 10 }}>✨ Ask them anything</Text>
                    <Text style={{ fontSize: 16, marginBottom: 10 }}>✨ Explore their world</Text>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.reader.primary, marginTop: 30 }]}
                    onPress={() => router.push('/onboarding/reader/book-selection')}
                >
                    <Text style={GlobalStyles.buttonText}>Start Exploring</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
