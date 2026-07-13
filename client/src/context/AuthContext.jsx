import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchCurrentUser, loginUser, logoutUser } from '../services/authService';

/**
 * AuthContext — provides global authentication state to the entire app.
 *
 * Shape:
 *   user        : { id, username, email, role } | null
 *   isLoading   : boolean  — true while the initial session check is running
 *   login(creds): Promise — calls loginUser(), updates state
 *   logout()    : Promise — calls logoutUser(), clears state
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // start true → run session check

  // On mount: check if there's an existing valid session (cookie still alive)
  useEffect(() => {
    const checkSession = async () => {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = useCallback(async (credentials) => {
    const userData = await loginUser(credentials);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — hook to consume AuthContext.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};
