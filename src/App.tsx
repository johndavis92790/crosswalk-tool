import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "./utils/firebase";
import { UserContext } from "./contexts/UserContext";
import { CrosswalkNavbar } from "./pages/CrosswalkNavbar";
import { Login } from "./pages/Login";

const allowedEmails = [
  process.env.REACT_APP_EMAIL_1,
  process.env.REACT_APP_EMAIL_2,
];

const App: React.FC = () => {
  const [user, setUser] = useState(null as User | null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user && allowedEmails.includes(user.email || "")) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  function handleSignOut() {
    signOut(auth);
  }

  return (
    <div className="App">
      <BrowserRouter>
        <UserContext.Provider
          value={{ user, setUser, signInWithGoogle, handleSignOut, loading }}
        >
          <CrosswalkNavbar />
          <Routes>
            <Route path="/" />
            <Route path="login" element={<Login />} />
          </Routes>
        </UserContext.Provider>
      </BrowserRouter>
    </div>
  );
};

export default App;
