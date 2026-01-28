import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="review-board" />
            <Stack.Screen name="governance" />
        </Stack>
    );
}
