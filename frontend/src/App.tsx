import React from "react";
import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home2 from "./pages/Home_v2";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="h-screen w-screen">
          <main className="h-full w-full">
            <Routes>
              <Route path="/" element={<Home2 />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
