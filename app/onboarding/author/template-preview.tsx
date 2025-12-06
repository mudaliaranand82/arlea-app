import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function TemplatePreview() {
    return (
        <SafeAreaView style={GlobalStyles.container}>
            <ScrollView>
                <Text style={[GlobalStyles.title, { color: Colors.author.primary }]}>Character Templates</Text>
                <Text style={GlobalStyles.subtitle}>
                    We use structured templates to bring your characters to life.
                </Text>

                <View style={GlobalStyles.card}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Template: Hero</Text>
                    <View style={{ backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                        <Text style={{ fontWeight: '600' }}>Name: [Character Name]</Text>
                        <Text style={{ color: '#666' }}>Role: Protagonist</Text>
                        <Text style={{ color: '#666', marginTop: 5 }}>
                            "The hero is the central figure who drives the plot forward..."
                        </Text>
                    </View>
                    <Text>
                        You'll fill out details like:
                        {'\n'}• Personality Traits
                        {'\n'}• Speaking Style
                        {'\n'}• Key Memories
                    </Text>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.author.primary }]}
                    onPress={() => router.push('/onboarding/author/tour')}
                >
                    <Text style={GlobalStyles.buttonText}>Got it, let's go!</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
