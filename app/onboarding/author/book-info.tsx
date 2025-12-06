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
        <SafeAreaView style={GlobalStyles.container}>
            <ScrollView>
                <Text style={[GlobalStyles.title, { color: Colors.author.primary }]}>Tell us about your book</Text>
                <Text style={GlobalStyles.subtitle}>This information helps us set up your world.</Text>

                <View style={GlobalStyles.card}>
                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Book Title</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. The Hobbit"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={{ marginBottom: 5, fontWeight: '600' }}>Genre</Text>
                    <TextInput
                        style={GlobalStyles.input}
                        placeholder="e.g. Fantasy"
                        value={genre}
                        onChangeText={setGenre}
                    />
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.author.primary }]}
                    onPress={() => router.push('/onboarding/author/template-preview')}
                >
                    <Text style={GlobalStyles.buttonText}>Next: Character Templates</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
