import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function DashboardLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.classic.background } }}>
            <Stack.Screen name="author" />
            <Stack.Screen name="reader" />
        </Stack>
    );
}
