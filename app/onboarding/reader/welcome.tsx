import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function ReaderWelcome() {
    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Welcome to Arlea!</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>
                    Step into your favorite books and chat with the characters you love.
                </Text>

                <View style={[GlobalStyles.card, { borderColor: Colors.classic.border, backgroundColor: Colors.classic.surface }]}>
                    <Text style={{ fontSize: 16, marginBottom: 10, color: Colors.classic.text, fontFamily: 'Outfit_400Regular' }}>✨ Meet your heroes</Text>
                    <Text style={{ fontSize: 16, marginBottom: 10, color: Colors.classic.text, fontFamily: 'Outfit_400Regular' }}>✨ Ask them anything</Text>
                    <Text style={{ fontSize: 16, marginBottom: 10, color: Colors.classic.text, fontFamily: 'Outfit_400Regular' }}>✨ Explore their world</Text>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary, marginTop: 30 }]}
                    onPress={() => router.push('/onboarding/reader/book-selection')}
                >
                    <Text style={GlobalStyles.buttonText}>Enter World</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
