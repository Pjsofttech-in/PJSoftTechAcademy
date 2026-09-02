import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {checkTokenValidity, setTokenExpiredCallback} from '../util/Apicall';

export const AuthContext = createContext();

export const AUTH_STATES = {
  LOADING: 'LOADING',
  ROLE_SELECTION: 'ROLE_SELECTION',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  AUTHENTICATED: 'AUTHENTICATED',
};

// Keys for all role tokens/data (use these in Apicall.js too!)
export const ALL_AUTH_KEYS = [
  'teacherToken',
  'teacherData',
  'userRole',
  // add more roles like 'studentToken', ... as needed in future
];

// ✅ Hook to use context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // On mount: init auth
  useEffect(() => {
    initializeAuth();
  }, []);

  // On token expiration
  useEffect(() => {
    setTokenExpiredCallback(async () => {
      // This ensures autologout on token expiration or 401 invalid!
      await AsyncStorage.multiRemove(ALL_AUTH_KEYS);
      setToken(null);
      setUserData(null);
      setUserRole(null);
      setSelectedRole(null);
      setIsAuthenticated(false);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      console.warn('⛔ Auto-logout: Session expired or unauthorized!');
    });
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setAuthState(AUTH_STATES.LOADING);

      const storedRole = await AsyncStorage.getItem('userRole');
      setSelectedRole(storedRole || null);

      if (storedRole) {
        const storedToken = await AsyncStorage.getItem(`${storedRole}Token`);
        const isValid = await checkTokenValidity(storedToken);

        if (isValid) {
          const storedUserData = await AsyncStorage.getItem(
            `${storedRole}Data`,
          );

          setToken(storedToken);
          const parsed = storedUserData ? JSON.parse(storedUserData) : null;
          const normalized = parsed
            ? {
                ...parsed,
                email: parsed.email || null,
                branchCode: parsed.branchCode || null,
                role: storedRole,
              }
            : null;

          setUserData(normalized);
          setUserRole(storedRole);
          setIsAuthenticated(true);
          setAuthState(AUTH_STATES.AUTHENTICATED);
          return;
        }
      }

      setAuthState(
        storedRole ? AUTH_STATES.UNAUTHENTICATED : AUTH_STATES.ROLE_SELECTION,
      );
      setIsAuthenticated(false);
    } catch (error) {
      console.error('[AuthContext] Init error:', error);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginResponse, roleFromParam) => {
    try {
      if (loginResponse?.token && roleFromParam) {
        await AsyncStorage.setItem(
          `${roleFromParam}Token`,
          loginResponse.token,
        );
        await AsyncStorage.setItem('userRole', roleFromParam);

        const rawUserData =
          loginResponse.data ||
          loginResponse.user ||
          loginResponse.userData ||
          loginResponse.studentData;

        if (rawUserData) {
          const normalizedUserData = {
            ...rawUserData,
            email: rawUserData.email || loginResponse.email || null,
            branchCode:
              rawUserData.branchCode || loginResponse.branchCode || null,
            role: roleFromParam,
          };

          await AsyncStorage.setItem(
            `${roleFromParam}Data`,
            JSON.stringify(normalizedUserData),
          );
          setUserData(normalizedUserData);
        }

        setToken(loginResponse.token);
        setUserRole(roleFromParam);
        setSelectedRole(roleFromParam);
        setIsAuthenticated(true);
        setAuthState(AUTH_STATES.AUTHENTICATED);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (userRole) {
        await AsyncStorage.multiRemove([
          `${userRole}Token`,
          `${userRole}Data`,
          'userRole',
        ]);
      }

      setToken(null);
      setUserData(null);
      setUserRole(null);
      setSelectedRole(null);
      setIsAuthenticated(false);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    }
  };

  const showLoading = () => setGlobalLoading(true);
  const hideLoading = () => setGlobalLoading(false);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        globalLoading,
        token,
        userData,
        userRole,
        authState,
        selectedRole,
        setSelectedRole,
        login,
        logout,
        refreshAuth: initializeAuth,
        showLoading,
        hideLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
