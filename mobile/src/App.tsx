import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { authService } from './services/authService';
import { useGameStore } from './store/gameStore';
import { AuthScreen } from './screens/AuthScreen';
import { RoomsScreen } from './screens/RoomsScreen';
import { RoomDetailScreen } from './screens/RoomDetailScreen';

type AppState = 'auth' | 'rooms' | 'roomDetail';

export default function App() {
  const { user, setUser } = useGameStore();
  const [appState, setAppState] = React.useState<AppState>('auth');
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(null);

  useEffect(() => {
    // Initialize auth state
    const unsubscribe = authService.onAuthChange(async (currentUser) => {
      if (currentUser) {
        const isGuest = await authService.isGuestUpgraded();
        setUser(currentUser, !isGuest);
        setAppState('rooms');
      } else {
        setUser(null, false);
        setAppState('auth');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setAppState('roomDetail');
  };

  const handleBackFromRoom = () => {
    setSelectedRoomId(null);
    setAppState('rooms');
  };

  return (
    <View style={styles.container}>
      {appState === 'auth' && <AuthScreen />}
      {appState === 'rooms' && (
        <RoomsScreen onRoomSelect={handleRoomSelect} />
      )}
      {appState === 'roomDetail' && selectedRoomId && (
        <RoomDetailScreen
          roomId={selectedRoomId}
          onBackPress={handleBackFromRoom}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
