import { router } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoleSelection } from '../components/ui/RoleSelection';
import { Colors } from '../constants/Colors';
import { GlobalStyles } from '../constants/Theme';

export default function WelcomeScreen() {
    return (
        <View style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={[styles.logo, { color: Colors.classic.primary }]}>Arlea</Text>
                    <Text style={[styles.tagline, { color: Colors.classic.textSecondary }]}>Where books come alive.</Text>
                </View>

                <View style={styles.content}>
                    <RoleSelection />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
                        <Text style={[styles.signInText, { color: Colors.classic.textSecondary }]}>
                            Already have an account? <Text style={[styles.signInLink, { color: Colors.classic.primary }]}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    header: {
        marginTop: 60,
        alignItems: 'center',
    },
    logo: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 56,
        marginBottom: 8,
        letterSpacing: -1,
    },
    tagline: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 20,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    footer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    signInText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
    },
    signInLink: {
        fontFamily: 'Outfit_700Bold',
    }
});
