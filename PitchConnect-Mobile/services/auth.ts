import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/auth/signin`,
        credentials
      );
      
      // Store tokens
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }

  async refreshToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken }
    );
    
    await AsyncStorage.setItem('token', response.data.token);
    return response.data.token;
  }

  async signup(data: any): Promise<AuthResponse> {
    const response = await axios.post(
      `${API_URL}/auth/signup`,
      data
    );
    
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  }
}

export default new AuthService();
