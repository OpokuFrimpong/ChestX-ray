// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const auth = getAuth(app)
export const db = getFirestore(app);

export {app, auth};