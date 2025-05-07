import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doSignInWithGoogle } from '../../firebase/auth'; // Import the Google auth function
import { getFirestore, doc, setDoc } from "firebase/firestore";
import './Login.css';
import loginIcon from '../Logo/loginIcon.jpg';
import mail from '../Logo/mail.png';
//import password from '../Logo/password.png';
import passwordIcon from '../Logo/password.png';


const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const auth = getAuth();
    const db = getFirestore();

    const handleSignupClick = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save additional user data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
            });

            console.log("User signed up and data saved successfully");
            navigate('/uploader');
        } catch (error) {
            console.error("Signup failed:", error.message);
            alert("Signup failed: " + error.message);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            const user = await doSignInWithGoogle();
            console.log("Google Signup Successful:", user);
            navigate('/uploader'); // Navigate to the Uploader page on success
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                alert("Google Signup was canceled. Please try again.");
            } else {
                console.error("Google Signup Failed:", error.message);
                alert("Google Signup Failed: " + error.message);
            }
        }
    };

    const handleLoginClick = () => {
        navigate('/login'); // Navigate to the Login page
    };

    return (
        <div className="container">
            <div className="header">
                <div className="text">Sign Up</div>
                <div className="underline"></div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="inputs">
                    <div className="input">
                        <img src={loginIcon} alt="Login Icon" />
                        <input
                            type="text"
                            placeholder="Username"
                            aria-label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input">
                        <img src={mail} alt="Email Icon" />
                        <input
                            type="email"
                            placeholder="Email"
                            aria-label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    

                    <div className="input">
                        <img src={passwordIcon} alt="Password Icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            aria-label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="submit-container">
                    <button
                        type="button"
                        className="submit"
                        onClick={handleSignupClick}
                    >
                        Sign Up
                    </button>
                    <button
                        type="button"
                        className="submit"
                        onClick={handleLoginClick}
                    >
                        Login
                    </button>
                </div>

                <div className="google-login-container">
                    <button
                        type="button"
                        className="google-login"
                        onClick={handleGoogleSignup}
                    >
                        Sign Up with Google
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Signup;
