import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import ResultPage from './pages/ResultPage';
import ChatbotPage from './pages/ChatbotPage';
import { checkGeminiConfiguration } from './services/geminiService';

function App() {
  useEffect(() => {
    // Check available Gemini models on app startup
    checkGeminiConfiguration()
      .then(available => {
        if (available) {
          console.log('Gemini API is properly configured');
        } else {
          console.warn('No Gemini models available with your API key - chat functionality may not work');
        }
      })
      .catch(err => {
        console.error('Error checking Gemini configuration:', err);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
      </Routes>
    </Router>
  );
}

export default App;