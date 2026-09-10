import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '../lib/api-client';
import { UserProfile, UserRole } from '../types/api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setSession = (tokens: AuthTokens, userProfile: UserProfile) => {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    setUser(userProfile);
  };

  const clearSession = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await apiClient.get<UserProfile>('/auth/me');
      setUser(profile);
    } catch (error) {
      // Try refresh token if available
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && error instanceof ApiError && error.status === 401) {
        try {
          const newTokens = await apiClient.post<AuthTokens>('/auth/refresh', {
            refreshToken,
          });
          localStorage.setItem('access_token', newTokens.accessToken);
          localStorage.setItem('refresh_token', newTokens.refreshToken);
          const profile = await apiClient.get<UserProfile>('/auth/me');
          setUser(profile);
        } catch {
          clearSession();
        }
      } else {
        clearSession();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const data = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    setSession(data.tokens, data.user);
    return data.user;
  };

  const register = async (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
  ): Promise<UserProfile> => {
    const trimmedFullName = fullName.trim();
    const data = await apiClient.post<AuthResponse>('/auth/register', {
      email,
      password,
      role,
      fullName: trimmedFullName,
    });
    setSession(data.tokens, data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => null);
      }
    } finally {
      clearSession();
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
