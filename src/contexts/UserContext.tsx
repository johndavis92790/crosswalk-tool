import { createContext, useContext } from "react";
import { User } from "firebase/auth";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => void;
  handleSignOut: () => void;
  loading: boolean;
}

export const UserContext = createContext<UserContextType | null>(null);

export function useUserContext() {
  return useContext(UserContext);
}
