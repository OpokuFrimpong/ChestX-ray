import './App.css';
import Login from './Components/Pages/Login.js';
import Signup from './Components/Pages/Signup.js';
import Uploader from './Components/Pages/Uploader.js';
import LandingPage from './Components/Pages/LandingPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/uploader" element={<Uploader />} />
        </Routes>
    );
}

export default App;
