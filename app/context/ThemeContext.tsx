import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    primaryLight: string;
    shadow: string;
  };
}

const lightColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#F0F0F0',
  primary: '#0066CC',
  primaryLight: '#E6F0FF',
  shadow: '#000000',
};

const darkColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2C2C2C',
  primary: '#4D9FFF',
  primaryLight: '#1A3D66',
  shadow: '#000000',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(deviceTheme || 'light');

  useEffect(() => {
    if (deviceTheme) {
      setTheme(deviceTheme);
    }
  }, [deviceTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 