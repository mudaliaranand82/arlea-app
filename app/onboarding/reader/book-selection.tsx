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
        <SafeAreaView style={[GlobalStyles.container, { backgroundColor: Colors.reader.background }]}>
            <ScrollView>
                <Text style={[GlobalStyles.title, { color: Colors.reader.text }]}>Pick a Book</Text>
                <Text style={[GlobalStyles.subtitle, { color: Colors.reader.text }]}>
                    Which world do you want to visit first?
                </Text>

                <View style={{ gap: 15 }}>
                    {books.map((book) => (
                        <TouchableOpacity
                            key={book.id}
                            style={GlobalStyles.card}
                            onPress={() => router.push('/onboarding/reader/tutorial')}
                        >
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{book.title}</Text>
                            <Text style={{ color: '#666' }}>by {book.author}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
