import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterFlow from './src/screens/RegisterFlow';
import MainAppContainer from './src/screens/MainAppContainer';
import { updateProfileOnServer } from './src/services/api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome' | 'login' | 'register' | 'main'
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [userSession, setUserSession] = useState({
    phone: '',
    user: null,
    registration: null,
  });

  const handleLoginSuccess = ({ phone, user, registration }) => {
    setUserSession({ phone, user, registration });
    // Always navigate to Home Page directly (as requested)
    setCurrentScreen('main');
  };

  const handleUpdateRegistration = async (updatedFields) => {
    setUserSession((prev) => ({
      ...prev,
      user: {
        ...(prev.user || {}),
        ...updatedFields,
        full_name: updatedFields.full_name || prev.user?.full_name,
        phone: updatedFields.phone || prev.user?.phone,
      },
      registration: {
        ...(prev.registration || {}),
        ...updatedFields,
      },
    }));

    const phone = userSession.phone || userSession.registration?.phone;
    if (phone) {
      try {
        await updateProfileOnServer({ phone, ...updatedFields });
      } catch (e) {
        // local state remains updated
      }
    }
  };

  const handleLogout = () => {
    setUserSession({
      phone: '',
      user: null,
      registration: null,
    });
    setCurrentScreen('welcome');
  };

  // 1. Standalone Splash Screen (runs exclusively during boot, no leaking underlying screens)
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <View style={styles.splashRoot}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <SplashScreen onFinish={() => setShowSplash(false)} />
        </View>
      </SafeAreaProvider>
    );
  }

  // 2. Main App Screen Router (clean, professional navigation)
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />

        <View style={styles.screenWrapper}>
          {currentScreen === 'main' && (
            <MainAppContainer
              user={userSession.user}
              registration={userSession.registration}
              onNavigateToRegister={() => setCurrentScreen('register')}
              onLogout={handleLogout}
              onUpdateRegistration={handleUpdateRegistration}
            />
          )}

          {currentScreen === 'welcome' && (
            <WelcomeScreen
              onNavigateToRegister={() => {
                setAuthMode('register');
                setCurrentScreen('login');
              }}
              onNavigateToLogin={() => {
                setAuthMode('login');
                setCurrentScreen('login');
              }}
            />
          )}

          {currentScreen === 'login' && (
            <LoginScreen
              mode={authMode}
              onBack={() => setCurrentScreen('welcome')}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentScreen === 'register' && (
            <RegisterFlow
              phone={userSession.phone}
              initialRegistration={userSession.registration}
              onBackToHome={() => setCurrentScreen('main')}
              onRegistrationSubmitted={(newReg) => {
                setUserSession((prev) => ({ ...prev, registration: newReg }));
                setCurrentScreen('main');
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenWrapper: {
    flex: 1,
  },
});

