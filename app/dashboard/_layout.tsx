import { Stack } from 'expo-router';

export default function DashboardLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="author" />
            <Stack.Screen name="reader" />
        </Stack>
    );
}
