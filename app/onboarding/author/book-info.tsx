import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function BookInfo() {
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Tell us about your book</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>This information helps us set up your world.</Text>

                <View style={[GlobalStyles.card, { borderColor: Colors.classic.border, backgroundColor: Colors.classic.surface }]}>
                    <Text style={{ marginBottom: 5, fontWeight: '600', color: Colors.classic.text }}>Book Title</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. The Hobbit"
                        placeholderTextColor="#999"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600', color: Colors.classic.text }}>Genre</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. Fantasy"
                        placeholderTextColor="#999"
                        value={genre}
                        onChangeText={setGenre}
                    />
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary }]}
                    onPress={() => router.push('/onboarding/author/template-preview')}
                >
                    <Text style={GlobalStyles.buttonText}>Next: Character Templates</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
