import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  Query,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface Player {
  userId: string;
  displayName: string;
  joinedAt: number;
  status: 'active' | 'disconnected';
  lastSeen: number;
}

export interface Room {
  id: string;
  name: string;
  creatorId: string;
  status: 'open' | 'playing' | 'closed';
  players: Player[];
  createdAt: number;
  updatedAt: number;
  maxPlayers: number;
}

const ROOMS_COLLECTION = 'rooms';
const PLAYERS_SUB_COLLECTION = 'players';
const MAX_PLAYERS = 4;

export const roomService = {
  createRoom: async (roomName: string): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const room = {
      name: roomName,
      creatorId: user.uid,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      maxPlayers: MAX_PLAYERS,
      playerCount: 1,
    };

    const docRef = await addDoc(collection(db, ROOMS_COLLECTION), room);

    // Add creator as first player
    await addDoc(
      collection(db, ROOMS_COLLECTION, docRef.id, PLAYERS_SUB_COLLECTION),
      {
        userId: user.uid,
        displayName: user.displayName || 'Anonymous',
        joinedAt: Date.now(),
        status: 'active',
        lastSeen: Date.now(),
      }
    );

    return docRef.id;
  },

  listPublicRooms: (callback: (rooms: Room[]) => void): Unsubscribe => {
    const q = query(
      collection(db, ROOMS_COLLECTION),
      where('status', '==', 'open')
    );

    return onSnapshot(q, async (snapshot) => {
      const rooms: Room[] = [];

      for (const roomDoc of snapshot.docs) {
        const data = roomDoc.data();
        const playersSnapshot = await getDoc(
          doc(db, ROOMS_COLLECTION, roomDoc.id)
        );

        rooms.push({
          id: roomDoc.id,
          name: data.name,
          creatorId: data.creatorId,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          maxPlayers: data.maxPlayers,
          players: data.players || [],
        });
      }

      callback(rooms);
    });
  },

  joinRoom: async (roomId: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    try {
      return await runTransaction(db, async (transaction) => {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomDoc = await transaction.get(roomRef);

        if (!roomDoc.exists()) throw new Error('Room not found');

        const room = roomDoc.data();
        const playerCount = room.playerCount || 0;

        // Enforce max 4 players
        if (playerCount >= MAX_PLAYERS) {
          return false;
        }

        // Check if already in room
        const playersRef = collection(db, ROOMS_COLLECTION, roomId, PLAYERS_SUB_COLLECTION);
        const existingPlayer = await transaction.get(
          query(playersRef, where('userId', '==', user.uid))
        );

        if (!existingPlayer.empty) {
          return true; // Already in room
        }

        // Add player
        await transaction.set(
          doc(playersRef),
          {
            userId: user.uid,
            displayName: user.displayName || 'Anonymous',
            joinedAt: Date.now(),
            status: 'active',
            lastSeen: Date.now(),
          }
        );

        // Update player count
        transaction.update(roomRef, {
          playerCount: playerCount + 1,
          updatedAt: Date.now(),
        });

        return true;
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const batch = writeBatch(db);
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const playersRef = collection(db, ROOMS_COLLECTION, roomId, PLAYERS_SUB_COLLECTION);

    // Find and delete player doc
    const querySnapshot = await query(
      playersRef,
      where('userId', '==', user.uid)
    );

    // Using getDoc on each to find the player
    const roomData = await getDoc(roomRef);
    const players = roomData.data()?.players || [];
    const playerToRemove = players.find((p: Player) => p.userId === user.uid);

    if (playerToRemove) {
      batch.update(roomRef, {
        players: players.filter((p: Player) => p.userId !== user.uid),
        playerCount: Math.max(0, (roomData.data()?.playerCount || 1) - 1),
        updatedAt: Date.now(),
      });
    }

    await batch.commit();
  },

  watchRoom: (roomId: string, callback: (room: Room | null) => void): Unsubscribe => {
    return onSnapshot(
      doc(db, ROOMS_COLLECTION, roomId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback({
            id: snapshot.id,
            name: data.name,
            creatorId: data.creatorId,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            maxPlayers: data.maxPlayers,
            players: data.players || [],
          });
        } else {
          callback(null);
        }
      }
    );
  },

  updatePlayerPresence: async (roomId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const players = roomDoc.data().players || [];
    const updatedPlayers = players.map((p: Player) =>
      p.userId === user.uid
        ? { ...p, lastSeen: Date.now(), status: 'active' }
        : p
    );

    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  },

  markPlayerDisconnected: async (roomId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const players = roomDoc.data().players || [];
    const updatedPlayers = players.map((p: Player) =>
      p.userId === user.uid
        ? { ...p, status: 'disconnected', lastSeen: Date.now() }
        : p
    );

    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  },
};
