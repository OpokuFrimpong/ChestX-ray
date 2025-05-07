import './App.css';
import Login from './Components/Pages/Login.js';
import Signup from './Components/Pages/Signup.js';
import Uploader from './Components/Pages/Uploader.js';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './Components/Pages/LandingPage';


function App() {
  return (
    <Router>
      <nav>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/login" className="nav-link">Login</Link> |
        <Link to="/signup" className="nav-link">Signup</Link> |
        <Link to="/uploader" className="nav-link">Uploader</Link>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/uploader" element={<Uploader />} />

      </Routes>
    </Router>
  );
}

export default App;
