import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function BookSelection() {
    const books = [
        { id: 1, title: "The Secret Garden", author: "Frances Hodgson Burnett" },
        { id: 2, title: "Treasure Island", author: "Robert Louis Stevenson" },
        { id: 3, title: "Alice in Wonderland", author: "Lewis Carroll" },
    ];

    return (
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={[GlobalStyles.title, { color: Colors.classic.primary }]}>Pick a Book</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.classic.textSecondary }]}>
                    Which world do you want to visit first?
                </Text>

                <View style={{ gap: 15 }}>
                    {books.map((book) => (
                        <TouchableOpacity
                            key={book.id}
                            style={[GlobalStyles.card, { borderColor: Colors.classic.border, backgroundColor: Colors.classic.surface }]}
                            onPress={() => router.push('/onboarding/reader/tutorial')}
                        >
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.classic.text, marginBottom: 4 }}>{book.title}</Text>
                            <Text style={{ color: Colors.classic.textSecondary }}>by {book.author}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
