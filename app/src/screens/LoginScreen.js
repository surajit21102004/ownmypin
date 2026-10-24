import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { sendOtp, verifyOtp, getApiBaseUrl } from '../services/api';
import ServerStatusModal from '../components/ServerStatusModal';

export default function LoginScreen({ onBack, onLoginSuccess, mode = 'login' }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);

  // Refs for OTP inputs
  const inputRefs = useRef([]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsResending(true);
    const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    const res = await sendOtp(fullPhone);
    setIsResending(false);

    if (res.success) {
      const code = res.otp ? String(res.otp) : '123456';
      setStatusMessage(`OTP sent! (Code: ${code})`);
      setOtp(code.split('').slice(0, 6));
    } else {
      Alert.alert('Connection Notice', res.message || 'Could not send OTP. Tap Server Settings to check IP.');
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    const res = await verifyOtp(fullPhone, fullOtp);
    setIsLoading(false);

    if (res.success) {
      // Pass user and existing registration (if any) to parent
      onLoginSuccess({
        phone: fullPhone,
        user: res.user,
        registration: res.registration,
      });
    } else {
      Alert.alert('Notice', `${res.message || 'Verification failed.'}\n\nTip: If your phone is on Wi-Fi, tap the server button at the top to confirm your PC's IP.`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Button & Server Settings */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serverPill}
            onPress={() => setShowServerModal(true)}
          >
            <Text style={styles.serverPillText}>⚙️ Server IP</Text>
          </TouchableOpacity>
        </View>

        {/* Center Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/ownmypin.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{mode === 'register' ? 'Create Account' : 'Login'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'register'
              ? 'Enter your mobile number to get an OTP and register your PIN.'
              : 'Enter your mobile number to get an OTP.'}
          </Text>
        </View>

        {/* Mobile Number Input */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Mobile number</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              value={phone.replace(/^\+91/, '')}
              onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="98XXXXXX00"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* OTP Input Section */}
        <View style={styles.formGroup}>
          <View style={styles.otpLabelRow}>
            <Text style={styles.inputLabel}>Enter 6-digit OTP</Text>
            <Text style={styles.otpHint}>Fixed: 123456</Text>
          </View>

          <View style={styles.otpRow}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  otp[index] ? styles.otpBoxFilled : null,
                ]}
                value={otp[index]}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
        </View>

        {statusMessage ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Verify and continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isResending && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={isResending}
            activeOpacity={0.85}
          >
            {isResending ? (
              <ActivityIndicator color="#152238" size="small" />
            ) : (
              <Text style={styles.secondaryBtnText}>Resend OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recognised by Startup India */}
        <View style={styles.startupBadgeRow}>
          <Text style={styles.startupLabel}>Recognised by </Text>
          <Text style={styles.startupHash}>#</Text>
          <Image
            source={require('../../assets/startupindia.png')}
            style={styles.startupLogo}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      {/* Server Settings Modal */}
      <ServerStatusModal
        visible={showServerModal}
        onClose={() => setShowServerModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backArrow: {
    fontSize: 28,
    color: '#0F172A',
    lineHeight: 32,
    marginTop: -2,
  },
  serverPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serverPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  logo: {
    width: 220,
    height: 60,
  },
  headerSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  otpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpHint: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderColor: '#152238',
    backgroundColor: '#F8FAFC',
  },
  statusBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionSection: {
    gap: 14,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#152238',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#152238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    borderColor: '#CBD5E1',
  },
  secondaryBtnText: {
    color: '#152238',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  startupBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
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
  startupLogo: {
    height: 28,
    width: 110,
  },
});
