import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doSignInWithGoogle } from '../../firebase/auth'; // Import the Google auth function
import './Login.css';
import mail from '../Logo/mail.png';
//import password from '../Logo/password.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const auth = getAuth();

    const handleLoginClick = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/uploader'); // Navigate to the Uploader page on success
        } catch (error) {
            console.error("Login failed:", error.message);
            alert("Login failed: " + error.message);
        }
    };

    const handleSignupClick = () => {
         navigate('/signup'); // Navigate to the Signup page
     };

    const handleGoogleLogin = async () => {
        try {
            const user = await doSignInWithGoogle();
            console.log("Google Login Successful:", user);
            navigate('/uploader'); // Navigate to the Uploader page on success
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                alert("Google Login was canceled. Please try again.");
            } else {
                console.error("Google Login Failed:", error.message);
                alert("Google Login Failed: " + error.message);
            }
        }
    };



    return (
        <div className="container">
            <div className="header">
                <div className="text">Login</div>
                <div className="underline"></div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="inputs">
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
                        <img src={password} alt="Password Icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            aria-label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="forgot-password">
                        Forget Password? <a href="/reset-password">Click Here!</a>
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
                        onClick={handleGoogleLogin}
                    >
                        Login with Google
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
