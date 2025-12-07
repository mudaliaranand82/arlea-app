import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { GlobalStyles } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Where stories come alive.',
        subtitle: 'Experience books like never before with interactive characters and worlds.',
        image: require('../assets/images/onboarding-1.png'),
    },
    {
        id: '2',
        title: 'Create your universe.',
        subtitle: 'Authors can build rich worlds and characters that readers can interact with.',
        image: require('../assets/images/onboarding-2.png'),
    },
    {
        id: '3',
        title: 'Chat with characters.',
        subtitle: 'Don\'t just read the story. Talk to the protagonist and shape the narrative.',
        image: require('../assets/images/onboarding-3.png'),
    },
];

export default function WelcomeScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);

    // Auto-redirect if logged in
    const { user, loading } = useAuth();

    React.useEffect(() => {
        if (!loading && user) {
            // Logic to check role and redirect could be centralized, but putting it here for now
            // to ensure users are sent to the right place.
            // We can assume if they are here, we might need to fetch the role again or 
            // let them click Login and be instantly redirected? 
            // Ideally auto-redirect:
            checkUserRole(user.uid);
        }
    }, [user, loading]);

    const checkUserRole = async (uid: string) => {
        try {
            const { getDoc, doc, collection, query, where, getDocs, limit } = await import('firebase/firestore');
            const { db } = await import('../firebaseConfig');

            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.role === 'author') {
                    const booksQ = query(collection(db, "books"), where("authorId", "==", uid), limit(1));
                    const booksSnap = await getDocs(booksQ);
                    if (!booksSnap.empty) {
                        router.replace('/dashboard/author');
                    } else {
                        router.replace('/onboarding/author/welcome');
                    }
                }
                else if (data.role === 'reader') router.replace('/dashboard/reader');
                else router.replace('/role-selection');
            } else {
                router.replace('/role-selection');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const onScroll = (event: any) => {
        scrollX.value = event.nativeEvent.contentOffset.x;
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    return (
        <View style={[GlobalStyles.container, { backgroundColor: Colors.classic.background }]}>
            <StatusBar barStyle="dark-content" />

            {/* Background Gradient Placeholder - In a real app, uses LinearGradient */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.classic.background }]}>
                {/* 
                   Dynamic background color based on slide could go here using Animated styles 
                   For now, we keep a clean premium background.
                */}
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                    <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 30 }}>
                        <Animated.Image
                            source={item.image}
                            style={styles.image}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                    </View>
                )}
            />

            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => {
                        const isActive = index === currentIndex;
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    { backgroundColor: isActive ? Colors.classic.primary : Colors.classic.border }
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: Colors.classic.primary, marginBottom: 15, width: '100%' }]}
                        onPress={() => router.push('/auth/sign-up')}
                    >
                        <Text style={GlobalStyles.buttonText}>Join for Free</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[GlobalStyles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.classic.primary, width: '100%' }]}
                        onPress={() => router.push('/auth/sign-in')}
                    >
                        <Text style={[GlobalStyles.buttonText, { color: Colors.classic.primary }]}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 350,
        marginBottom: 40,
    },
    title: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 48,
        color: Colors.classic.text,
        marginBottom: 20,
        letterSpacing: -1,
        lineHeight: 56,
    },
    subtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 20,
        color: Colors.classic.textSecondary,
        lineHeight: 28,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 50,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    }
});
