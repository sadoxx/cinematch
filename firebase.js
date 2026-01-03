// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Note: Analytics is not typically used in React Native/Expo
// If you need it, use @react-native-firebase/analytics instead

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpHtoGVMxKUJEKBvChve0sAWR9sGYPK6s",
  authDomain: "cinematch-c02c1.firebaseapp.com",
  projectId: "cinematch-c02c1",
  storageBucket: "cinematch-c02c1.firebasestorage.app",
  messagingSenderId: "232811548864",
  appId: "1:232811548864:web:dd91a7fffe1f795b5b1d25",
  measurementId: "G-9C4PJS31RQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
