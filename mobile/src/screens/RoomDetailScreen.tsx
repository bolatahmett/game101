import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { roomService, Room, Player } from '../services/roomService';

interface RoomDetailScreenProps {
  roomId: string;
  onBackPress: () => void;
}

export const RoomDetailScreen: React.FC<RoomDetailScreenProps> = ({
  roomId,
  onBackPress,
}) => {
  const { user, setCurrentRoom, currentRoom } = useGameStore();
  const [appState, setAppState] = useState(AppState.currentState);
  const [presenceTimer, setPresenceTimer] = useState<NodeJS.Timer | null>(null);

  useEffect(() => {
    // Subscribe to room updates
    const unsubscribe = roomService.watchRoom(roomId, (room) => {
      setCurrentRoom(room);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Handle presence updates and disconnects
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Update presence every 5 seconds
    const timer = setInterval(() => {
      if (appState === 'active') {
        roomService.updatePlayerPresence(roomId);
      }
    }, 5000);

    setPresenceTimer(timer);

    return () => {
      subscription.remove();
      if (timer) clearInterval(timer);
    };
  }, [appState]);

  const handleAppStateChange = async (nextAppState: any) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground - update presence
      console.log('App came to foreground, updating presence');
      await roomService.updatePlayerPresence(roomId);
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background - mark disconnected
      console.log('App went to background, marking disconnected');
      await roomService.markPlayerDisconnected(roomId);
    }

    setAppState(nextAppState);
  };

  const handleLeaveRoom = async () => {
    try {
      await roomService.leaveRoom(roomId);
      setCurrentRoom(null);
      onBackPress();
    } catch (error) {
      Alert.alert('Error', 'Failed to leave room');
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerCard}>
      <View>
        <Text style={styles.playerName}>{item.displayName}</Text>
        <Text style={styles.playerStatus}>
          {item.status === 'active' ? '🟢 Online' : '🔴 Disconnected'}
        </Text>
      </View>
      <Text style={styles.playerJoinTime}>
        Joined: {new Date(item.joinedAt).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (!currentRoom) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading room...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.roomHeader}>
          <Text style={styles.roomTitle}>{currentRoom.name}</Text>
          <Text style={styles.playerCount}>
            {currentRoom.players?.length || 0}/{currentRoom.maxPlayers} Players
          </Text>
        </View>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{currentRoom.status}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Created</Text>
          <Text style={styles.statusValue}>
            {new Date(currentRoom.createdAt).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      <Text style={styles.playersTitle}>Players in Room</Text>
      <FlatList
        data={currentRoom.players || []}
        keyExtractor={(item) => item.userId}
        renderItem={renderPlayer}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No players yet</Text>
        }
      />

      <TouchableOpacity
        style={[
          styles.button,
          currentRoom.status === 'playing' && styles.disabledButton,
        ]}
        onPress={handleLeaveRoom}
        disabled={currentRoom.status === 'playing'}
      >
        <Text style={styles.buttonText}>
          {currentRoom.status === 'playing' ? 'Game in Progress' : 'Leave Room'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  roomHeader: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerCount: {
    fontSize: 14,
    color: '#aaa',
  },
  statusSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  playersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  playerCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playerStatus: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
  },
  playerJoinTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 14,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#aaa',
    fontSize: 14,
  },
  button: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
