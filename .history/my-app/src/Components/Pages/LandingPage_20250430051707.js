import React from 'react';
import './LandingPage.css'; // Import the CSS file for styling

const LandingPage = () => {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to MediView AI</h1>
                    <p>Your one-stop solution for medical visualization with AI.</p>
                    <button className="cta-button">Get Started</button>
                </div>
            </header>

            {/* Features Section */}
            <section className="features-section">
                <h2>Features</h2>
                <div className="features">
                    <div className="feature">
                        <img src="/icons/feature1.png" alt="Feature 1" />
                        <h3>Feature 1</h3>
                        <p>AI-Powered Diagnosis</p>
<p>Upload X-ray scans to receive fast, accurate lung disease predictions powered by deep learning</p>
                    </div>
                    <div className="feature">
                        <img src="/icons/feature2.png" alt="Feature 2" />
                        <h3>Feature 2</h3>
                        <p>Model Confidence Scores</p>
                        <p>See how confident the system is in its predictions, aiding human-in-the-loop decision</p>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="footer">
                <div className="footer-content">
                    <p>&copy; 2025 MediView. All rights reserved.</p>
                    <div className="social-media">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                    </div>
                    <div className="footer-links">
                        <a href="/privacy-policy">Privacy Policy</a>
                        <a href="/contact">Contact Us</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;