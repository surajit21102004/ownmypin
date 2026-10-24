import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import ServerStatusModal from '../components/ServerStatusModal';
import { checkBackendHealth } from '../services/api';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onNavigateToRegister, onNavigateToLogin }) {
  const [selectedLang, setSelectedLang] = useState('English');
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const res = await checkBackendHealth();
    setServerOnline(res.ok);
  };

  const languages = ['English', 'हिंदी (Hindi)', 'বাংলা (Bengali)'];

  return (
    <View style={styles.container}>
      {/* Top Bar: Server Status & Language Dropdown */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.serverPill}
          activeOpacity={0.8}
          onPress={() => setShowServerModal(true)}
        >
          <View
            style={[
              styles.serverDot,
              {
                backgroundColor:
                  serverOnline === true
                    ? '#10B981'
                    : serverOnline === false
                    ? '#EF4444'
                    : '#F59E0B',
              },
            ]}
          />
          <Text style={styles.serverPillText}>
            {serverOnline === true
              ? 'Backend: Online'
              : serverOnline === false
              ? 'Offline (Tap)'
              : 'Checking...'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.langPill}
          activeOpacity={0.8}
          onPress={() => setShowLangModal(true)}
        >
          <Text style={styles.langIcon}>🌐</Text>
          <Text style={styles.langText}>{selectedLang}</Text>
          <Text style={styles.dropdownArrow}>∨</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Central Illustration */}
        <View style={styles.illustrationWrapper}>
          <Image
            source={require('../../assets/welcome_illustration.jpg')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Text & Logo */}
        <View style={styles.brandContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Image
            source={require('../../assets/ownmypin.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>
            A smarter way to share your digital address.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={onNavigateToRegister}
          >
            <Text style={styles.btnIcon}>👤+</Text>
            <Text style={styles.primaryBtnText}>Create an Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        {/* Recognised by Startup India */}
        <View style={styles.startupBadgeRow}>
          <Text style={styles.startupLabel}>Recognised by </Text>
          <Text style={styles.startupHash}>#</Text>
          <Image
            source={require('../../assets/startupindia.png')}
            style={styles.startupLogoSmall}
            resizeMode="contain"
          />
        </View>

        {/* Privacy Policy Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.privacyLink}
              onPress={() => setShowPrivacyModal(true)}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langOption,
                  selectedLang === lang.split(' ')[0] && styles.selectedOption,
                ]}
                onPress={() => {
                  setSelectedLang(lang.split(' ')[0]);
                  setShowLangModal(false);
                }}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    selectedLang === lang.split(' ')[0] && styles.selectedOptionText,
                  ]}
                >
                  {lang}
                </Text>
                {selectedLang === lang.split(' ')[0] && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '75%' }]}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <ScrollView style={{ marginVertical: 12 }}>
              <Text style={styles.privacyBody}>
                OwnMyPin respects your personal privacy. All address data, selfies, and property
                photographs captured during registration are encrypted and solely utilized for DIGIPIN
                generation and official address verification.
                {'\n\n'}
                • No personal address data is ever sold or publicized without consent.
                {'\n'}
                • Standard non-patterned DIGIPINs follow the national SS-DD-NNNNNNNN protocol.
                {'\n'}
                • Age requirement is strictly 16+ as verified by Government ID.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.primaryBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Server Settings Modal */}
      <ServerStatusModal
        visible={showServerModal}
        onClose={() => {
          setShowServerModal(false);
          checkHealth();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  langIcon: {
    fontSize: 14,
  },
  langText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownArrow: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 32,
  },
  illustrationWrapper: {
    width: width * 0.85,
    height: width * 0.72,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  logo: {
    width: width * 0.65,
    height: 70,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    width: '100%',
    gap: 14,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: '#152238',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    gap: 10,
    shadowColor: '#152238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  secondaryBtnText: {
    color: '#152238',
    fontSize: 16,
    fontWeight: '700',
  },
  startupBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  startupLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  startupHash: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F97316',
    marginRight: 2,
  },
  startupLogoSmall: {
    height: 28,
    width: 110,
  },
  footerContainer: {
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  privacyLink: {
    color: '#152238',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedOption: {
    backgroundColor: '#F1F5F9',
  },
  langOptionText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#152238',
    fontWeight: '700',
  },
  checkIcon: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 16,
  },
  privacyBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
});
