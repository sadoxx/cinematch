# Ciné-Match - Expo Startup Guide

## 🚀 How to Run Your App

### Step 1: Install Expo Go on Your Phone
1. Download **Expo Go** from:
   - iOS: App Store
   - Android: Google Play Store

### Step 2: Start the Development Server
Open a terminal in the `cine-match` folder and run:

```bash
cd "c:\Users\hp\react movie\cine-match"
npx expo start
```

### Step 3: Scan the QR Code
1. After running the command, a QR code will appear in your terminal
2. On **iOS**: Open the Camera app and scan the QR code
3. On **Android**: Open the Expo Go app and tap "Scan QR Code"

Your app will load on your phone! 📱

## 🎬 What the App Does

- **Connects to Firebase**: Tests your Firestore connection
- **Shows Movies**: Displays movies from your Firestore 'movies' collection
- **Like Button**: Saves liked movies to 'liked_movies' collection
- **Skip Button**: Move to the next movie without saving

## 📝 Adding Movies to Firestore

To see movies in your app, add documents to the `movies` collection in Firestore:

1. Go to Firebase Console → Firestore Database
2. Create a collection called `movies`
3. Add documents with these fields:
   - `title` (string): "The Shawshank Redemption"
   - `description` (string): "Two imprisoned men bond over..."
   - Add any other fields you want!

## 🔧 Useful Commands

```bash
# Start with QR code (default)
npx expo start

# Start and open in web browser
npx expo start --web

# Clear cache and restart
npx expo start --clear

# Stop the server
Press Ctrl + C in the terminal
```

## 🐛 Troubleshooting

- **Can't scan QR code?**: Make sure your phone and computer are on the same WiFi network
- **Connection failed?**: Check your Firebase configuration in `firebase.js`
- **App crashes?**: Check the terminal for error messages

## 📱 App Features

- ✅ React Native components (View, Text, TouchableOpacity)
- ✅ Firebase Firestore integration
- ✅ Like/Skip functionality
- ✅ Movie counter
- ✅ Netflix-inspired dark theme
- ✅ Responsive layout

Enjoy building Ciné-Match! 🎥✨
