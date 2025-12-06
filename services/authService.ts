import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

export const AuthService = {
    // Google Auth Hook
    useGoogleAuth: () => {
        const [request, response, promptAsync] = Google.useAuthRequest({
            // TODO: Replace with actual Client IDs from Google Cloud Console
            iosClientId: 'YOUR_IOS_CLIENT_ID',
            androidClientId: 'YOUR_ANDROID_CLIENT_ID',
            webClientId: 'YOUR_WEB_CLIENT_ID',
        });

        const signInWithGoogle = async () => {
            if (response?.type === 'success') {
                const { id_token } = response.params;
                const credential = GoogleAuthProvider.credential(id_token);
                return signInWithCredential(auth, credential);
            }
            return null;
        };

        return { request, response, promptAsync, signInWithGoogle };
    },

    // Apple Auth Function
    signInWithApple: async () => {
        try {
            const rawNonce = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
            const requestedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: requestedNonce,
            });

            const { identityToken } = credential;
            if (!identityToken) {
                throw new Error('No identity token provided.');
            }

            const provider = new OAuthProvider('apple.com');
            const firebaseCredential = provider.credential({
                idToken: identityToken,
                rawNonce: rawNonce,
            });

            return signInWithCredential(auth, firebaseCredential);
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // User canceled the sign-in flow
                return null;
            }
            throw e;
        }
    }
};
