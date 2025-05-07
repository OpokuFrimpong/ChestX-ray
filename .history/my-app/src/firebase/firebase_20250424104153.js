// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvxsVjDGZ8XxkPcgj6_my87D_Uo0g8c6I",
  authDomain: "lung-detection-11326.firebaseapp.com",
  projectId: "lung-detection-11326",
  storageBucket: "lung-detection-11326.firebasestorage.app",
  messagingSenderId: "893775820373",
  appId: "1:893775820373:web:c5df13b295480a764406dc",
  measurementId: "G-0SPF0Y3JHQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { app, auth, db }; // Export Firestore instance