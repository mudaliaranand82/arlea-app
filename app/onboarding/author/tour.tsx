import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { GlobalStyles } from '../../../constants/Theme';

export default function DashboardTour() {
    return (
        <SafeAreaView style={GlobalStyles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Text style={[GlobalStyles.title, { color: Colors.author.primary }]}>Your Dashboard</Text>
                <Text style={GlobalStyles.subtitle}>
                    Here's a quick tour of where you'll manage everything.
                </Text>

                <View style={{ gap: 15, marginBottom: 30 }}>
                    <View style={GlobalStyles.card}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>📚 My Books</Text>
                        <Text style={{ color: '#666' }}>Manage your library and add new titles.</Text>
                    </View>

                    <View style={GlobalStyles.card}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>👥 Characters</Text>
                        <Text style={{ color: '#666' }}>Create and edit character profiles.</Text>
                    </View>

                    <View style={GlobalStyles.card}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>📊 Analytics</Text>
                        <Text style={{ color: '#666' }}>See how readers are interacting.</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[GlobalStyles.button, { backgroundColor: Colors.author.primary }]}
                    onPress={() => router.replace('/dashboard/author')}
                >
                    <Text style={GlobalStyles.buttonText}>Enter Dashboard</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
