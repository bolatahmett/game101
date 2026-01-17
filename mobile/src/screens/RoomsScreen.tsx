import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { roomService, Room } from '../services/roomService';
import { authService } from '../services/authService';

interface RoomsScreenProps {
  onRoomSelect: (roomId: string) => void;
}

export const RoomsScreen: React.FC<RoomsScreenProps> = ({ onRoomSelect }) => {
  const { publicRooms, setPublicRooms, user, isGuest, setUser } = useGameStore();
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = roomService.listPublicRooms((rooms) => {
      setPublicRooms(rooms);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Error', 'Room name is required');
      return;
    }

    setLoading(true);
    try {
      const roomId = await roomService.createRoom(roomName);
      setRoomName('');
      onRoomSelect(roomId);
    } catch (error) {
      Alert.alert('Error', 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string, playerCount: number) => {
    if (playerCount >= 4) {
      Alert.alert('Error', 'Room is full (max 4 players)');
      return;
    }

    setLoading(true);
    try {
      const success = await roomService.joinRoom(roomId);
      if (success) {
        onRoomSelect(roomId);
      } else {
        Alert.alert('Error', 'Failed to join room or room is full');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null, false);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleUpgradeAccount = async () => {
    // Navigate to Google Sign-In
    Alert.alert('Upgrade Account', 'This should trigger Google Sign-In flow');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Game101 Rooms</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userText}>
            {user?.displayName || 'Anonymous'} {isGuest && '(Guest)'}
          </Text>
          {isGuest && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={handleUpgradeAccount}
            >
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.createRoomSection}>
        <TextInput
          style={styles.input}
          placeholder="Room name..."
          placeholderTextColor="#999"
          value={roomName}
          onChangeText={setRoomName}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.disabledBtn]}
          onPress={handleCreateRoom}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Room</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Public Rooms</Text>
      <FlatList
        data={publicRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.roomCard}
            onPress={() => handleJoinRoom(item.id, item.players?.length || 0)}
            disabled={loading}
          >
            <View>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomInfo}>
                Players: {item.players?.length || 0}/{item.maxPlayers}
              </Text>
              <Text style={styles.creatorInfo}>
                Creator: {item.creatorId.substring(0, 8)}...
              </Text>
            </View>
            <Text style={styles.joinArrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No rooms available</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userText: {
    color: '#aaa',
    fontSize: 14,
  },
  upgradeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#4285F4',
    borderRadius: 4,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#666',
    borderRadius: 4,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 12,
  },
  createRoomSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    fontSize: 14,
  },
  createBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    borderRadius: 4,
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  roomCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  roomInfo: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 2,
  },
  creatorInfo: {
    fontSize: 12,
    color: '#888',
  },
  joinArrow: {
    fontSize: 20,
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 14,
  },
});
