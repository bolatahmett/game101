# Firebase Multiplayer Game Setup

## Requirements
- Node 18+
- Firebase project
- Google OAuth credentials

## Mobile App Setup

```bash
cd mobile
npm install
```

Create `.env` in `mobile/src/config/`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=<your-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<app-id>
EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
```

Update `app.json` Google OAuth:
```json
{
  "iosClientId": "<ios-client-id>.apps.googleusercontent.com",
  "androidClientId": "<android-client-id>.apps.googleusercontent.com",
  "webClientId": "<web-client-id>.apps.googleusercontent.com"
}
```

Run:
```bash
npm run start
```

## Firebase Setup

1. Deploy Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

2. Deploy Cloud Functions:
```bash
cd backend
npm install
firebase deploy --only functions
```

3. Enable Authentication Methods:
- Anonymous (Settings → Auth Providers)
- Google (Settings → Auth Providers)

## Architecture

- **Guest Auth**: Anonymous auth → Firestore user doc
- **Guest Upgrade**: Link Google to anonymous account
- **Max 4 Players**: Transaction validation + Cloud Function enforcement
- **Disconnect Handling**: AppState listener + 30s TTL cleanup
- **Real-time Sync**: Firestore listeners on rooms + players

## Key Features
- ✓ Guest play (no login)
- ✓ Guest → Google upgrade
- ✓ Public room discovery
- ✓ Max 4 player enforcement
- ✓ Automatic disconnect cleanup
- ✓ Player presence tracking
- ✓ Real-time room updates
