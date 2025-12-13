import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class MobileAuthService {
  private API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  private SESSION_KEY = 'pitchconnect_session';

  async login(email: string, password: string): Promise<AuthSession> {
    try {
      const response = await axios.post(`${this.API_URL}/auth/signin`, {
        email,
        password,
      });

      const session: AuthSession = {
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      await AsyncStorage.setItem(
        this.SESSION_KEY,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      throw new Error('Login failed');
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.SESSION_KEY);
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const session = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!session) return null;

      const parsed: AuthSession = JSON.parse(session);

      // Check if token expired
      if (parsed.expiresAt < Date.now()) {
        await this.logout();
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthSession> {
    try {
      const response = await axios.post(`${this.API_URL}/auth/refresh`, {
        refreshToken,
      });

      const session: AuthSession = {
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      await AsyncStorage.setItem(
        this.SESSION_KEY,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }
}

export const mobileAuth = new MobileAuthService();
