import {
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
} from '@expo-google-fonts/lora';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
} from '@expo-google-fonts/playfair-display';
import {
    Raleway_300Light,
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
} from '@expo-google-fonts/raleway';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        // Legacy fonts (keeping for backwards compatibility)
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        Outfit_400Regular,
        Outfit_500Medium,
        Outfit_600SemiBold,
        Outfit_700Bold,

        // Literary Luxe - Display font (Playfair Display)
        PlayfairDisplay: PlayfairDisplay_400Regular,
        'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
        'PlayfairDisplay-Medium': PlayfairDisplay_500Medium,
        'PlayfairDisplay-SemiBold': PlayfairDisplay_600SemiBold,
        'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
        'PlayfairDisplay-ExtraBold': PlayfairDisplay_800ExtraBold,
        'PlayfairDisplay-Black': PlayfairDisplay_900Black,

        // Literary Luxe - Body font (Lora)
        Lora: Lora_400Regular,
        'Lora-Italic': Lora_400Regular_Italic,
        'Lora-Medium': Lora_500Medium,
        'Lora-SemiBold': Lora_600SemiBold,
        'Lora-Bold': Lora_700Bold,

        // Literary Luxe - UI font (Raleway)
        Raleway: Raleway_400Regular,
        'Raleway-Light': Raleway_300Light,
        'Raleway-Medium': Raleway_500Medium,
        'Raleway-SemiBold': Raleway_600SemiBold,
        'Raleway-Bold': Raleway_700Bold,
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="dashboard" />
            </Stack>
        </AuthProvider>
    );
}
