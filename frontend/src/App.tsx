import React from "react";
import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home2 from "./pages/Home_v2";
import Stream from "./pages/stream";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="h-screen w-screen bg-slate-200">
          <header className="w-full bg-white shadow-sm">
            <div className="mx-auto px-2 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src="/fema-logo-blue.svg" alt="FEMA Logo" className="h-8" />
                <h1 className="text-xl font-semibold text-gray-800">AI Code Assistant</h1>
              </div>
              <nav className="flex space-x-4">
                <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                <a href="/stream" className="text-gray-600 hover:text-gray-900">Code Stream</a>
              </nav>
            </div>
          </header>
          <main className="h-[calc(100%-4rem)] w-full">
            <Routes>
              <Route path="/" element={<Home2 />} />
              <Route path="/stream" element={<Stream />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
