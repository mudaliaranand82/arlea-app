import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ActionCard } from './ActionCard';

export function RoleSelection() {
    return (
        <View style={styles.container}>
            <ActionCard
                title="I am an Author"
                subtitle="Create worlds, characters, and stories."
                backgroundColor={Colors.classic.surface}
                textColor={Colors.classic.text}
                onPress={() => router.push('/onboarding/author/welcome')}
            />

            <ActionCard
                title="I am a Reader"
                subtitle="Chat with characters and explore stories."
                backgroundColor={Colors.classic.surface}
                textColor={Colors.classic.text}
                onPress={() => router.push('/onboarding/reader/welcome')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 16,
    }
});
