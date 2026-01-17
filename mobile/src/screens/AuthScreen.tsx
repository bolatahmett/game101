import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authService } from '../services/authService';
import { useGameStore } from '../store/gameStore';

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const { setUser } = useGameStore();
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response);
    }
  }, [response]);

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      const user = await authService.signInAsGuest();
      setUser(user, true);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in as guest');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    setLoading(true);
    try {
      const { id_token, access_token } = response.params;
      await authService.signInWithGoogle(id_token, access_token);
      const user = authService.getCurrentUser();
      if (user) {
        const isGuest = await authService.isGuestUpgraded();
        setUser(user, !isGuest);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game101</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          <TouchableOpacity
            style={[styles.button, styles.guestButton]}
            onPress={handleGuestSignIn}
          >
            <Text style={styles.buttonText}>Play as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  button: {
    width: 300,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  guestButton: {
    backgroundColor: '#666',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
