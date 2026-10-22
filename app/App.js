import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterFlow from './src/screens/RegisterFlow';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome' | 'login' | 'register'
  const [userSession, setUserSession] = useState({
    phone: '',
    user: null,
    registration: null,
  });

  const handleLoginSuccess = ({ phone, user, registration }) => {
    setUserSession({ phone, user, registration });
    // Go directly to registration flow / status tracker
    setCurrentScreen('register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Main View Router */}
      <View style={styles.screenWrapper}>
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onNavigateToRegister={() => setCurrentScreen('login')}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onBack={() => setCurrentScreen('welcome')}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {currentScreen === 'register' && (
          <RegisterFlow
            phone={userSession.phone || '+919876543210'}
            initialRegistration={userSession.registration}
            onBackToHome={() => setCurrentScreen('welcome')}
          />
        )}
      </View>

      {/* Animated Zoom-In Splash Screen overlay */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  screenWrapper: {
    flex: 1,
  },
});
