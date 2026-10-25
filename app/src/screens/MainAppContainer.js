import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import AppHeader from '../components/AppHeader';
import BottomNavBar from '../components/BottomNavBar';
import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import ScannerScreen from './ScannerScreen';
import DscScreen from './DscScreen';
import AccountScreen from './AccountScreen';
import NotificationsModal from '../components/NotificationsModal';
import ProfileDetailsModal from '../components/ProfileDetailsModal';
import QrCodeModal from '../components/QrCodeModal';
import { getNotifications, searchPin } from '../services/api';

export default function MainAppContainer({
  user,
  registration,
  onNavigateToRegister,
  onLogout,
  onUpdateRegistration,
}) {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'search' | 'scanner' | 'dsc' | 'account'
  const [lang, setLang] = useState('en'); // 'en' | 'bn' | 'hi'

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Profile Details Modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // QR Modal
  const [qrModalInfo, setQrModalInfo] = useState({ visible: false, pin: '', name: '' });

  // Search Screen Initial Query (e.g., set when coming from Scanner)
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const fetchNotificationsData = async () => {
    try {
      const res = await getNotifications(user?.phone);
      if (res && res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || res.notifications.length);
      }
    } catch (e) {
      // ignore
    }
  };

  // Language cycle toggle: EN -> BN -> HI -> EN
  const handleCycleLang = () => {
    if (lang === 'en') setLang('bn');
    else if (lang === 'bn') setLang('hi');
    else setLang('en');
  };

  // Open QR modal
  const handleOpenQrModal = (pin, name) => {
    setQrModalInfo({ visible: true, pin, name });
  };

  // Open profile modal
  const handleViewProfile = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  // When QR code is scanned in ScannerScreen
  const handleScanResult = async (scannedPin, fromDirectScan = true) => {
    try {
      const res = await searchPin(scannedPin);
      if (res && res.success && res.profile) {
        setSelectedProfile({ ...res.profile, isDirectShare: fromDirectScan });
        setShowProfileModal(true);
      } else {
        setSearchInitialQuery(scannedPin);
        setCurrentTab('search');
      }
    } catch (e) {
      setSearchInitialQuery(scannedPin);
      setCurrentTab('search');
    }
  };

  return (
    <View style={styles.container}>

      {/* Top Header shown only for Search, Scanner, DSC */}
      {currentTab !== 'home' && currentTab !== 'account' && (
        <AppHeader
          lang={lang}
          onToggleLang={handleCycleLang}
          unreadCount={unreadCount}
          onOpenNotifications={() => {
            setShowNotifModal(true);
            setUnreadCount(0);
          }}
        />
      )}

      {/* Primary Tab View */}
      <View style={styles.tabContentArea}>
        {currentTab === 'home' && (
          <HomeScreen
            user={user}
            registration={registration}
            onOpenQrModal={handleOpenQrModal}
            onNavigateToSearch={() => setCurrentTab('search')}
            onNavigateToScanner={() => setCurrentTab('scanner')}
            onNavigateToDsc={() => setCurrentTab('dsc')}
            onNavigateToRegister={onNavigateToRegister}
            onOpenNotifications={() => {
              setShowNotifModal(true);
              setUnreadCount(0);
            }}
            onNavigateToAccount={() => setCurrentTab('account')}
            unreadCount={unreadCount}
          />
        )}

        {currentTab === 'search' && (
          <SearchScreen
            lang={lang}
            initialQuery={searchInitialQuery}
            onViewProfile={handleViewProfile}
          />
        )}

        {currentTab === 'scanner' && (
          <ScannerScreen
            lang={lang}
            onSwitchToSearch={() => setCurrentTab('search')}
            onScanResult={handleScanResult}
          />
        )}

        {currentTab === 'dsc' && <DscScreen lang={lang} />}

        {currentTab === 'account' && (
          <AccountScreen
            user={user}
            registration={registration}
            lang={lang}
            onSelectLang={setLang}
            onNavigateToRegister={onNavigateToRegister}
            onLogout={onLogout}
            onUpdateRegistration={onUpdateRegistration}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={currentTab}
        onSelectTab={(tabId) => {
          if (tabId === 'search') {
            setSearchInitialQuery('');
          }
          setCurrentTab(tabId);
        }}
        lang={lang}
      />

      {/* Notifications & Ads Drawer Modal */}
      <NotificationsModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        onClearAll={() => {
          setNotifications([]);
          setUnreadCount(0);
        }}
        lang={lang}
      />

      {/* Profile Details Modal */}
      <ProfileDetailsModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={selectedProfile}
        isDirectShare={!!selectedProfile?.isDirectShare}
        lang={lang}
      />

      {/* DIGIPIN QR Code Modal */}
      <QrCodeModal
        visible={qrModalInfo.visible}
        onClose={() => setQrModalInfo({ ...qrModalInfo, visible: false })}
        pin={qrModalInfo.pin}
        name={qrModalInfo.name}
        lang={lang}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContentArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
