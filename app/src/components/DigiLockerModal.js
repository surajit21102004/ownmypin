import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  initiateDigilockerVerification,
  callbackDigilockerVerification,
  completeDigilockerVerification,
  getDigilockerStatus,
} from '../services/api';

const { width, height } = Dimensions.get('window');

// DigiLocker Official Logo asset (copied to app/assets/digilocker.png)
const DIGILOCKER_LOGO = require('../../assets/digilocker.png');

export default function DigiLockerModal({
  visible,
  onClose,
  phone,
  userName = '',
  onVerificationSuccess,
  autoStart = false,
}) {
  const [stage, setStage] = useState('intro'); // 'intro' | 'loading' | 'webview' | 'verifying' | 'success' | 'error'
  const [authUrl, setAuthUrl] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [stateParam, setStateParam] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedData, setVerifiedData] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (visible) {
      setHasCompleted(false);
      setErrorMessage('');
      if (autoStart) {
        startVerification();
      } else {
        setStage('intro');
      }
    } else {
      setStage('intro');
      setAuthUrl(null);
      setRecordId(null);
    }
  }, [visible, autoStart]);

  const startVerification = async () => {
    try {
      setStage('loading');
      setErrorMessage('');

      const res = await initiateDigilockerVerification(phone);

      if (res && res.success && res.data && res.data.authUrl) {
        setAuthUrl(res.data.authUrl);
        setRecordId(res.data.recordId);
        setStateParam(res.data.state);
        setStage('webview');
      } else {
        setErrorMessage(res?.message || 'Could not initiate DigiLocker session. Please try again.');
        setStage('error');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error occurred while connecting to DigiLocker.');
      setStage('error');
    }
  };

  /**
   * Parse query params from a redirected URL
   */
  const parseQueryParams = (url) => {
    const params = {};
    if (!url) return params;
    const queryString = url.split('?')[1];
    if (!queryString) return params;

    queryString.split('&').forEach((pair) => {
      const [key, val] = pair.split('=');
      if (key && val) {
        params[decodeURIComponent(key)] = decodeURIComponent(val.replace(/\+/g, ' '));
      }
    });
    return params;
  };

  /**
   * Complete the exchange when redirect happens
   */
  const handleCompleteFlow = async (code, stateVal, codeVerifier) => {
    if (hasCompleted) return;
    setHasCompleted(true);
    setStage('verifying');

    try {
      const currentRecordId = recordId;

      // 1. If code was extracted, exchange callback
      if (code) {
        try {
          await callbackDigilockerVerification({
            code,
            state: stateVal || stateParam || '',
            codeVerifier: codeVerifier || '',
            recordId: currentRecordId,
          });
        } catch (cbErr) {
          console.warn('[DigiLocker] Callback step notice:', cbErr.message);
        }
      }

      // 2. Call /complete on backend (which checks DB cache & provider)
      let compRes = null;
      try {
        compRes = await completeDigilockerVerification(currentRecordId, phone);
      } catch (compErr) {
        console.warn('[DigiLocker] Complete initial notice:', compErr.message);
      }

      if (compRes && compRes.success) {
        const aadhaar = compRes.data?.aadhaarData || {};
        const resolvedName = aadhaar.name || userName || 'Verified Resident';
        setVerifiedData({
          name: resolvedName,
          dob: aadhaar.dateOfBirth,
          gender: aadhaar.gender,
          address: aadhaar.address,
          recordId: currentRecordId,
        });
        setStage('success');
        return;
      }

      // 3. Fallback check: query status endpoint to see if redirect handler already finalized it
      try {
        const statusRes = await getDigilockerStatus(phone);
        if (statusRes && statusRes.isVerified) {
          setVerifiedData({
            name: statusRes.verifiedName || userName || 'Verified Resident',
            dob: statusRes.details?.dob,
            gender: statusRes.details?.gender,
            address: statusRes.details?.address,
            recordId: currentRecordId,
          });
          setStage('success');
          return;
        }
      } catch (stErr) {
        // ignore
      }

      setErrorMessage(compRes?.message || 'Verification completed but details could not be parsed.');
      setStage('error');
    } catch (err) {
      // Check status once more before showing error
      try {
        const statusRes = await getDigilockerStatus(phone);
        if (statusRes && statusRes.isVerified) {
          setVerifiedData({
            name: statusRes.verifiedName || userName || 'Verified Resident',
            recordId,
          });
          setStage('success');
          return;
        }
      } catch (ign) {}

      setErrorMessage(err.message || 'Failed to complete DigiLocker verification.');
      setStage('error');
    }
  };

  const handleNavChange = (navState) => {
    const { url } = navState;
    if (!url) return;

    // Detect redirect to callback URL or URL containing code=
    if (
      url.includes('callback') ||
      url.includes('code=') ||
      url.includes('ownmypin://digilocker-complete')
    ) {
      const params = parseQueryParams(url);
      handleCompleteFlow(params.code || null, params.state || null, params.codeVerifier || null);
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'DIGILOCKER_COMPLETE' && msg.success) {
        setStage('verifying');
        setTimeout(async () => {
          if (recordId) {
            const compRes = await completeDigilockerVerification(recordId, phone);
            if (compRes?.success) {
              setVerifiedData(compRes.data?.aadhaarData || {});
              setStage('success');
              return;
            }
          }
          setStage('success');
        }, 1000);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSuccessClose = () => {
    if (onVerificationSuccess) {
      onVerificationSuccess(verifiedData);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <Image source={DIGILOCKER_LOGO} style={styles.headerLogo} resizeMode="contain" />
              <View>
                <Text style={styles.headerTitle}>DigiLocker Verification</Text>
                <Text style={styles.headerSub}>Government of India • UIDAI Consent</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 1. Intro Screen with Trust Value & Skip Option */}
          {stage === 'intro' && (
            <ScrollView style={styles.scrollBody} contentContainerStyle={styles.introContent}>
              <View style={styles.heroLogoWrap}>
                <Image source={DIGILOCKER_LOGO} style={styles.heroBigLogo} resizeMode="contain" />
                <View style={styles.heroTrustPill}>
                  <Text style={styles.heroTrustPillText}>✓ 100% Government Certified ID</Text>
                </View>
              </View>

              <Text style={styles.introHeadline}>
                Verify with DigiLocker to Get the Trusted Badge
              </Text>
              <Text style={styles.introDesc}>
                Add the official <Text style={{ fontWeight: '800', color: '#1E40AF' }}>Verified by DigiLocker</Text> logo to your DIGIPIN profile. Stand out with maximum trust, credibility, and verified doorstep identity.
              </Text>

              {/* Benefits Box */}
              <View style={styles.benefitsCard}>
                <View style={styles.benefitRow}>
                  <Text style={styles.benefitCheck}>✓</Text>
                  <View style={styles.benefitTextCol}>
                    <Text style={styles.benefitTitle}>Official DigiLocker Badge</Text>
                    <Text style={styles.benefitSub}>Displays the verified logo on your public address & PIN card.</Text>
                  </View>
                </View>

                <View style={styles.benefitRow}>
                  <Text style={styles.benefitCheck}>✓</Text>
                  <View style={styles.benefitTextCol}>
                    <Text style={styles.benefitTitle}>Aadhaar Identity Authenticated</Text>
                    <Text style={styles.benefitSub}>Seamlessly verified via DigiLocker OTP without uploading physical cards.</Text>
                  </View>
                </View>

                <View style={styles.benefitRow}>
                  <Text style={styles.benefitCheck}>✓</Text>
                  <View style={styles.benefitTextCol}>
                    <Text style={styles.benefitTitle}>Fast 60-Second Process</Text>
                    <Text style={styles.benefitSub}>Safe, paperless, and encrypted government-grade verification.</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.verifyMainBtn}
                onPress={startVerification}
                activeOpacity={0.85}
              >
                <Image source={DIGILOCKER_LOGO} style={styles.btnMiniLogo} resizeMode="contain" />
                <Text style={styles.verifyMainBtnText}>Verify with DigiLocker</Text>
              </TouchableOpacity>

              {/* Skip Option (as requested: skip that time or do it in account section) */}
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Skip for now (I'll do it later)</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* 2. Loading Initiation */}
          {stage === 'loading' && (
            <View style={styles.centerBox}>
              <Image source={DIGILOCKER_LOGO} style={styles.pulsingLogo} resizeMode="contain" />
              <ActivityIndicator size="large" color="#1E40AF" style={{ marginVertical: 18 }} />
              <Text style={styles.loadingTitle}>Connecting to DigiLocker...</Text>
              <Text style={styles.loadingSub}>Initiating secure government Aadhaar authentication portal</Text>
            </View>
          )}

          {/* 3. Embedded Secure WebView */}
          {stage === 'webview' && authUrl && (
            <View style={styles.webviewWrapper}>
              <View style={styles.webviewHintBar}>
                <Text style={styles.webviewHintText}>
                  🔒 Complete your Aadhaar login on DigiLocker to finish verification
                </Text>
              </View>
              <WebView
                source={{ uri: authUrl }}
                style={styles.webview}
                onNavigationStateChange={handleNavChange}
                onMessage={handleWebViewMessage}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.webviewLoading}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text style={{ marginTop: 10, fontSize: 13, color: '#64748B' }}>
                      Loading DigiLocker Portal...
                    </Text>
                  </View>
                )}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          )}

          {/* 4. Processing Final Aadhaar Completion */}
          {stage === 'verifying' && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#10B981" style={{ marginBottom: 16 }} />
              <Text style={styles.loadingTitle}>Verifying with DigiLocker...</Text>
              <Text style={styles.loadingSub}>
                Authenticating government Aadhaar record and issuing your certified trust badge...
              </Text>
            </View>
          )}

          {/* 5. Success Screen */}
          {stage === 'success' && (
            <View style={styles.centerBox}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successIconCheck}>✓</Text>
              </View>

              <Image source={DIGILOCKER_LOGO} style={styles.successLogoBadge} resizeMode="contain" />

              <Text style={styles.successTitle}>Verified by DigiLocker!</Text>
              <Text style={styles.successSub}>
                Your Aadhaar identity has been confirmed via Government of India DigiLocker.
              </Text>

              {verifiedData?.name ? (
                <View style={styles.verifiedNameBox}>
                  <Text style={styles.verifiedNameLabel}>VERIFIED AADHAAR NAME</Text>
                  <Text style={styles.verifiedNameText}>{verifiedData.name}</Text>
                </View>
              ) : null}

              <View style={styles.badgeGrantedBox}>
                <Image source={DIGILOCKER_LOGO} style={{ width: 20, height: 20, marginRight: 8 }} resizeMode="contain" />
                <Text style={styles.badgeGrantedText}>DigiLocker Trust Badge Added to Profile</Text>
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleSuccessClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>View Verified Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 6. Error Screen */}
          {stage === 'error' && (
            <View style={styles.centerBox}>
              <View style={styles.errorIconCircle}>
                <Text style={styles.errorIconCross}>✕</Text>
              </View>
              <Text style={styles.errorTitle}>Verification Not Completed</Text>
              <Text style={styles.errorSub}>{errorMessage}</Text>

              <TouchableOpacity
                style={styles.verifyMainBtn}
                onPress={startVerification}
                activeOpacity={0.85}
              >
                <Text style={styles.verifyMainBtnText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Close & Return to App</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.92,
    minHeight: height * 0.65,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 34,
    height: 34,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
  },
  introContent: {
    padding: 24,
    alignItems: 'center',
  },
  heroLogoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBigLogo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  heroTrustPill: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroTrustPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
  },
  introHeadline: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  benefitSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  verifyMainBtn: {
    width: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  btnMiniLogo: {
    width: 22,
    height: 22,
  },
  verifyMainBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  pulsingLogo: {
    width: 70,
    height: 70,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  webviewWrapper: {
    flex: 1,
    height: height * 0.78,
  },
  webviewHintBar: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  webviewHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successIconCheck: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  successLogoBadge: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 300,
    lineHeight: 18,
  },
  verifiedNameBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  verifiedNameLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  verifiedNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
  },
  badgeGrantedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeGrantedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3730A3',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconCross: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
});
