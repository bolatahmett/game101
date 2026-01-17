import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const PRESENCE_TIMEOUT = 30000; // 30 seconds
const MAX_PLAYERS = 4;

// Cleanup disconnected players
export const cleanupDisconnectedPlayers = functions
  .pubsub.schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = Date.now();
    const threshold = now - PRESENCE_TIMEOUT;

    const roomsSnapshot = await db.collection('rooms').get();

    for (const roomDoc of roomsSnapshot.docs) {
      const players = roomDoc.data().players || [];
      const activePlayers = players.filter(
        (p: any) => p.status === 'active' || p.lastSeen > threshold
      );

      if (activePlayers.length !== players.length) {
        await roomDoc.ref.update({
          players: activePlayers,
          playerCount: activePlayers.length,
          updatedAt: Date.now(),
        });
      }

      // Delete empty rooms
      if (activePlayers.length === 0) {
        await roomDoc.ref.delete();
      }
    }

    return null;
  });

// Validate room joins
export const validateRoomJoin = functions.firestore
  .document('rooms/{roomId}')
  .onWrite(async (change, context) => {
    const roomId = context.params.roomId;
    const room = change.after.data();

    if (!room) return null;

    // Enforce max 4 players
    const players = room.players || [];
    if (players.length > MAX_PLAYERS) {
      // Remove excess players (keep earliest joiners)
      const trimmedPlayers = players
        .sort((a: any, b: any) => a.joinedAt - b.joinedAt)
        .slice(0, MAX_PLAYERS);

      await change.after.ref.update({
        players: trimmedPlayers,
        playerCount: trimmedPlayers.length,
      });
    }

    return null;
  });
