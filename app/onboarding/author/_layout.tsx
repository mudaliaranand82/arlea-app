import { Stack } from 'expo-router';

export default function AuthorOnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="book-info" />
            <Stack.Screen name="template-preview" />
            <Stack.Screen name="tour" />
        </Stack>
    );
}
