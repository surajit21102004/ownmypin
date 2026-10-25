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
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  sendOtp,
  verifyOtp,
  loginWithPassword,
  registerAccountWithPassword,
  registerBusinessAccount,
  uploadImageToServer,
} from '../services/api';
import ServerStatusModal from '../components/ServerStatusModal';

export default function LoginScreen({ onBack, onLoginSuccess, mode: initialMode = 'login' }) {
  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState(initialMode);
  // Role: 'user' | 'business'
  const [role, setRole] = useState('user');
  // Login type: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState('password');

  // Business registration step: 1 (Credentials) | 2 (Shop Details & Docs)
  const [businessStep, setBusinessStep] = useState(1);

  // Common fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Business specific fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [category, setCategory] = useState('Retail & Shopping');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Hooghly');
  const [state, setState] = useState('West Bengal');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState(22.7126);
  const [longitude, setLongitude] = useState(88.3524);
  const [isLocating, setIsLocating] = useState(false);
  const [shopLogoUri, setShopLogoUri] = useState(null);
  const [shopPhotos, setShopPhotos] = useState([]);
  const [docType, setDocType] = useState('GSTIN'); // 'GSTIN' | 'PAN' | 'UDYAM'
  const [docNumber, setDocNumber] = useState('');
  const [docFileUri, setDocFileUri] = useState(null);
  const [docFileName, setDocFileName] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);

  // OTP inputs refs
  const inputRefs = useRef([]);

  const categories = [
    'Retail & Shopping',
    'Food & Restaurant',
    'Grocery & Essentials',
    'Pharmacy & Health',
    'Electronics & Repair',
    'Services & Others',
  ];

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const getCleanPhone = () => {
    const p = phone.replace(/[^0-9]/g, '');
    return p.startsWith('91') && p.length === 12 ? `+${p}` : `+91${p}`;
  };

  const handleSendOtp = async () => {
    const p = phone.replace(/[^0-9]/g, '');
    if (!p || p.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsResending(true);
    const fullPhone = getCleanPhone();
    const res = await sendOtp(fullPhone);
    setIsResending(false);

    if (res.success) {
      const code = res.otp ? String(res.otp) : '123456';
      setStatusMessage(`OTP sent! (Hardcoded code: ${code})`);
      setOtp(code.split('').slice(0, 6));
    } else {
      Alert.alert('Connection Notice', res.message || 'Could not send OTP.');
    }
  };

  // 1. Password Login
  const handlePasswordLogin = async () => {
    const p = phone.replace(/[^0-9]/g, '');
    if (!p || p.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter your 10-digit mobile number.');
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    const fullPhone = getCleanPhone();
    const res = await loginWithPassword(fullPhone, password, role);
    setIsLoading(false);

    if (res.success) {
      onLoginSuccess({
        phone: fullPhone,
        user: res.user,
        registration: res.registration || res.businessRegistration,
      });
    } else {
      Alert.alert(
        'Login Failed',
        res.message || 'Invalid credentials. You can also tap "Login with OTP" if you forgot your password.'
      );
    }
  };

  // 2. OTP Login
  const handleOtpLogin = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    const fullPhone = getCleanPhone();
    const res = await verifyOtp(fullPhone, fullOtp, password, role);
    setIsLoading(false);

    if (res.success) {
      onLoginSuccess({
        phone: fullPhone,
        user: res.user,
        registration: res.registration || res.businessRegistration,
      });
    } else {
      Alert.alert('Notice', res.message || 'Verification failed.');
    }
  };

  // 3. User Registration
  const handleUserRegister = async () => {
    const p = phone.replace(/[^0-9]/g, '');
    if (!p || p.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter your 10-digit mobile number.');
      return;
    }
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      Alert.alert('OTP Required', 'Please enter the 6-digit OTP (Code: 123456).');
      return;
    }
    if (!password || password.length < 4) {
      Alert.alert('Password Required', 'Please create a password of at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords you entered do not match.');
      return;
    }

    setIsLoading(true);
    const fullPhone = getCleanPhone();
    const res = await registerAccountWithPassword({
      phone: fullPhone,
      otp: fullOtp,
      password,
      role: 'user',
      fullName,
    });
    setIsLoading(false);

    if (res.success) {
      Alert.alert('Account Created', 'Your user account is ready! Now register your doorstep PIN.');
      onLoginSuccess({
        phone: fullPhone,
        user: res.user,
        registration: null,
      });
    } else {
      Alert.alert('Registration Notice', res.message || 'Failed to create account.');
    }
  };

  // 4. Business Registration - Step 1 continue
  const handleBusinessStep1Next = () => {
    if (!shopName.trim()) {
      Alert.alert('Shop Name Required', 'Please enter your business or shop name.');
      return;
    }
    if (!ownerName.trim()) {
      Alert.alert('Owner Name Required', 'Please enter the owner full name.');
      return;
    }
    const p = phone.replace(/[^0-9]/g, '');
    if (!p || p.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      Alert.alert('OTP Required', 'Please enter the 6-digit OTP (Code: 123456).');
      return;
    }
    if (!password || password.length < 4) {
      Alert.alert('Password Required', 'Please create a password (at least 4 characters).');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords do not match.');
      return;
    }

    setBusinessStep(2);
  };

  // Use GPS location for business
  const handleFetchGpsLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        Alert.alert('Permission Denied', 'Please grant location permission to capture your shop GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(Number(loc.coords.latitude.toFixed(6)));
      setLongitude(Number(loc.coords.longitude.toFixed(6)));

      // Reverse geocode
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo) {
          if (geo.city) setCity(geo.city);
          if (geo.district && !district) setDistrict(geo.district);
          if (geo.region && !state) setState(geo.region);
          if (geo.postalCode) setPincode(geo.postalCode);
          if (geo.street && !addressLine) setAddressLine(geo.street);
        }
      } catch (e) {}

      setIsLocating(false);
      Alert.alert('GPS Captured', `Shop coordinates: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
    } catch (e) {
      setIsLocating(false);
      Alert.alert('Notice', 'Could not fetch current GPS location. Please enter manually.');
    }
  };

  // Pick Shop Logo
  const handlePickLogo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setShopLogoUri(res.assets[0].uri);
      }
    } catch (e) {}
  };

  // Pick Shop Photos
  const handlePickShopPhotos = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });
      if (!res.canceled && res.assets) {
        const uris = res.assets.map((a) => a.uri);
        setShopPhotos((prev) => [...prev, ...uris].slice(0, 4));
      }
    } catch (e) {}
  };

  // Pick Document (PDF / Image)
  const handlePickDocument = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setDocFileUri(res.assets[0].uri);
        setDocFileName(`${docType}_Document_${Date.now()}.jpg`);
      }
    } catch (e) {}
  };

  // 5. Final Business Registration Submit
  const handleBusinessRegisterSubmit = async () => {
    if (!addressLine.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert('Incomplete Address', 'Please provide your shop address, city, and pincode.');
      return;
    }
    if (!docNumber.trim()) {
      Alert.alert('Document Number Required', `Please enter your valid ${docType} Number.`);
      return;
    }
    if (!docFileUri) {
      Alert.alert('Document File Required', `Please upload a photo or copy of your ${docType} document.`);
      return;
    }

    setIsLoading(true);
    const fullPhone = getCleanPhone();

    // Upload logo if selected
    let uploadedLogo = null;
    if (shopLogoUri) {
      uploadedLogo = await uploadImageToServer(shopLogoUri, 'business_logo');
    }

    // Upload document file
    let uploadedDoc = null;
    if (docFileUri) {
      uploadedDoc = await uploadImageToServer(docFileUri, 'business_doc');
    }

    // Upload shop photos
    const uploadedPhotos = [];
    for (const uri of shopPhotos) {
      const u = await uploadImageToServer(uri, 'business_photo');
      if (u) uploadedPhotos.push(u);
    }

    const businessPayload = {
      phone: fullPhone,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      category,
      addressLine: addressLine.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark.trim(),
      latitude,
      longitude,
      shopLogoUrl: uploadedLogo || shopLogoUri,
      shopImages: uploadedPhotos,
      docType,
      docNumber: docNumber.trim(),
      docFileUrl: uploadedDoc || docFileUri,
    };

    // First ensure user account is created with password
    await registerAccountWithPassword({
      phone: fullPhone,
      otp: otp.join(''),
      password,
      role: 'business',
      fullName: ownerName.trim(),
      shopName: shopName.trim(),
    });

    const res = await registerBusinessAccount(businessPayload);
    setIsLoading(false);

    if (res.success) {
      Alert.alert(
        'Business Application Submitted',
        'Your business registration and verification documents have been received by the OwnMyPin admin team. Once approved, your business PIN will be live!',
        [
          {
            text: 'Continue to App',
            onPress: () => {
              onLoginSuccess({
                phone: fullPhone,
                user: { phone: fullPhone, role: 'business', full_name: ownerName, shop_name: shopName },
                registration: res.businessRegistration,
              });
            },
          },
        ]
      );
    } else {
      Alert.alert('Submission Notice', res.message || 'Could not complete registration.');
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
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serverPill} onPress={() => setShowServerModal(true)}>
            <Text style={styles.serverPillText}>⚙️ Server IP</Text>
          </TouchableOpacity>
        </View>

        {/* Center Logo */}
        <View style={styles.logoWrapper}>
          <Image source={require('../../assets/ownmypin.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* ------------------------------------------------------------- */}
        {/* ROLE SELECTOR: USER vs BUSINESS                               */}
        {/* ------------------------------------------------------------- */}
        <View style={styles.roleSelectorCard}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'user' && styles.roleTabActive]}
            activeOpacity={0.8}
            onPress={() => {
              setRole('user');
              setBusinessStep(1);
            }}
          >
            <Text style={[styles.roleTabText, role === 'user' && styles.roleTabTextActive]}>
              👤 User Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'business' && styles.roleTabActive]}
            activeOpacity={0.8}
            onPress={() => setRole('business')}
          >
            <Text style={[styles.roleTabText, role === 'business' && styles.roleTabTextActive]}>
              🏪 Business / Shop
            </Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* AUTH MODE TOGGLE: LOGIN vs CREATE ACCOUNT                     */}
        {/* ------------------------------------------------------------- */}
        <View style={styles.authModeRow}>
          <TouchableOpacity
            style={[styles.modeTab, authMode === 'login' && styles.modeTabActive]}
            onPress={() => {
              setAuthMode('login');
              setBusinessStep(1);
            }}
          >
            <Text style={[styles.modeTabText, authMode === 'login' && styles.modeTabTextActive]}>
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, authMode === 'register' && styles.modeTabActive]}
            onPress={() => setAuthMode('register')}
          >
            <Text style={[styles.modeTabText, authMode === 'register' && styles.modeTabTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header Title & Subtitle */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>
            {authMode === 'login'
              ? `${role === 'business' ? 'Business' : 'User'} Login`
              : role === 'business'
              ? businessStep === 1
                ? 'Create Business Account'
                : 'Shop Verification Details'
              : 'Create User Account'}
          </Text>
          <Text style={styles.subtitle}>
            {authMode === 'login'
              ? `Login to your ${role === 'business' ? 'business doorstep profile' : 'verified digital address'}`
              : role === 'business'
              ? businessStep === 1
                ? 'Set up your store login credentials and owner phone'
                : 'Upload shop location & government verification document (GSTIN/PAN/Udyam)'
              : 'Register your mobile number and set your password to claim your digital PIN.'}
          </Text>
        </View>

        {/* ============================================================= */}
        {/* VIEW A: LOGIN MODE                                            */}
        {/* ============================================================= */}
        {authMode === 'login' && (
          <View>
            {/* Login Method Sub-Toggle: Password vs OTP */}
            <View style={styles.subToggleRow}>
              <TouchableOpacity
                style={[styles.subToggleBtn, loginMethod === 'password' && styles.subToggleBtnActive]}
                onPress={() => setLoginMethod('password')}
              >
                <Text
                  style={[styles.subToggleText, loginMethod === 'password' && styles.subToggleTextActive]}
                >
                  🔑 With Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subToggleBtn, loginMethod === 'otp' && styles.subToggleBtnActive]}
                onPress={() => setLoginMethod('otp')}
              >
                <Text
                  style={[styles.subToggleText, loginMethod === 'otp' && styles.subToggleTextActive]}
                >
                  💬 With OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Number */}
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

            {/* Password Field (when loginMethod === 'password') */}
            {loginMethod === 'password' ? (
              <View style={styles.formGroup}>
                <View style={styles.otpLabelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.showPassText}>{showPassword ? 'Hide 🙈' : 'Show 👁️'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              /* OTP Field (when loginMethod === 'otp') */
              <View style={styles.formGroup}>
                <View style={styles.otpLabelRow}>
                  <Text style={styles.inputLabel}>Enter 6-digit OTP</Text>
                  <Text style={styles.otpHint}>Fixed Code: 123456</Text>
                </View>
                <View style={styles.otpRow}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[styles.otpBox, otp[index] ? styles.otpBoxFilled : null]}
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
            )}

            {statusMessage ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={loginMethod === 'password' ? handlePasswordLogin : handleOtpLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {loginMethod === 'password' ? 'Login' : 'Verify and Login'}
                  </Text>
                )}
              </TouchableOpacity>

              {loginMethod === 'otp' ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, isResending && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={isResending}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryBtnText}>
                    {isResending ? 'Sending...' : 'Send / Resend OTP (123456)'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.textLinkBtn}
                  onPress={() => {
                    setLoginMethod('otp');
                    handleSendOtp();
                  }}
                >
                  <Text style={styles.textLink}>Forgot password? Login with OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ============================================================= */}
        {/* VIEW B: USER REGISTRATION                                     */}
        {/* ============================================================= */}
        {authMode === 'register' && role === 'user' && (
          <View>
            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Mobile Number */}
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

            {/* OTP Input */}
            <View style={styles.formGroup}>
              <View style={styles.otpLabelRow}>
                <Text style={styles.inputLabel}>Verify with OTP</Text>
                <TouchableOpacity onPress={handleSendOtp}>
                  <Text style={styles.otpHint}>Get Code: 123456</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.otpRow}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[styles.otpBox, otp[index] ? styles.otpBoxFilled : null]}
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

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Create Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 4 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {statusMessage ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleUserRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create Account & Register PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================= */}
        {/* VIEW C: BUSINESS REGISTRATION (Multi-step)                    */}
        {/* ============================================================= */}
        {authMode === 'register' && role === 'business' && (
          <View>
            {/* Step Progress indicator */}
            <View style={styles.stepProgressRow}>
              <View style={[styles.stepDot, businessStep >= 1 && styles.stepDotActive]}>
                <Text style={styles.stepDotNum}>1</Text>
              </View>
              <Text style={styles.stepLabel}>Credentials</Text>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, businessStep >= 2 && styles.stepDotActive]}>
                <Text style={styles.stepDotNum}>2</Text>
              </View>
              <Text style={styles.stepLabel}>Shop & Docs</Text>
            </View>

            {/* BUSINESS STEP 1: Basic Credentials */}
            {businessStep === 1 ? (
              <View>
                {/* Shop Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Shop / Business Name *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={shopName}
                      onChangeText={setShopName}
                      placeholder="e.g. Bengal Sweets & Bakery"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Owner Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Owner Full Name *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={ownerName}
                      onChangeText={setOwnerName}
                      placeholder="e.g. Surajit Mandal"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Mobile Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Business Mobile Number *</Text>
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

                {/* OTP Verification */}
                <View style={styles.formGroup}>
                  <View style={styles.otpLabelRow}>
                    <Text style={styles.inputLabel}>Verify Phone with OTP *</Text>
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Text style={styles.otpHint}>Code: 123456</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.otpRow}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[styles.otpBox, otp[index] ? styles.otpBoxFilled : null]}
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

                {/* Password */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Create Account Password *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 4 characters"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Confirm Password *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Next Step Button */}
                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleBusinessStep1Next}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryBtnText}>Next: Shop Details & Documents ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* BUSINESS STEP 2: Shop Details & Document Upload */
              <View>
                {/* Category Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Shop Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map((c, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.catChip, category === c && styles.catChipActive]}
                        onPress={() => setCategory(c)}
                      >
                        <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* GPS Location Button */}
                <View style={styles.gpsRow}>
                  <TouchableOpacity
                    style={styles.gpsBtn}
                    onPress={handleFetchGpsLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#112240" />
                    ) : (
                      <Text style={styles.gpsBtnText}>📍 Use Current Shop GPS ({latitude}, {longitude})</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Address Line */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Shop Address Line *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={addressLine}
                      onChangeText={setAddressLine}
                      placeholder="e.g. 12/B GT Road, Morepukur"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* City & Pincode in Row */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>City / Town *</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.textInput}
                        value={city}
                        onChangeText={setCity}
                        placeholder="e.g. Rishra"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Pincode *</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.textInput}
                        value={pincode}
                        onChangeText={setPincode}
                        placeholder="712248"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>
                </View>

                {/* Landmark */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Nearby Landmark</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={landmark}
                      onChangeText={setLandmark}
                      placeholder="Near Station / School / Temple"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Shop Logo & Photos */}
                <View style={styles.mediaSection}>
                  <Text style={styles.inputLabel}>Shop Logo & Photos</Text>
                  <View style={styles.mediaButtonsRow}>
                    <TouchableOpacity style={styles.mediaBtn} onPress={handlePickLogo}>
                      <Text style={styles.mediaBtnText}>
                        {shopLogoUri ? '✓ Logo Selected' : '📷 Upload Logo'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.mediaBtn} onPress={handlePickShopPhotos}>
                      <Text style={styles.mediaBtnText}>
                        {shopPhotos.length > 0
                          ? `✓ ${shopPhotos.length} Photos Selected`
                          : '🖼️ Shop Photos (1-4)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* --------------------------------------------------- */}
                {/* GOVERNMENT VERIFICATION DOCUMENT SECTION           */}
                {/* --------------------------------------------------- */}
                <View style={styles.docSection}>
                  <Text style={styles.docSectionTitle}>📋 Government Business Verification *</Text>
                  <Text style={styles.docSectionSubtitle}>
                    Select one document type, enter the number, and attach a clear copy.
                  </Text>

                  {/* Document Type Radio Buttons */}
                  <View style={styles.docTypeRow}>
                    {['GSTIN', 'PAN', 'UDYAM'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.docTypeChip, docType === type && styles.docTypeChipActive]}
                        onPress={() => setDocType(type)}
                      >
                        <Text
                          style={[
                            styles.docTypeChipText,
                            docType === type && styles.docTypeChipTextActive,
                          ]}
                        >
                          {type === 'GSTIN'
                            ? 'GSTIN Number'
                            : type === 'PAN'
                            ? 'PAN Card'
                            : 'Udyam Aadhaar'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Document Number Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>
                      Enter {docType} Number *
                    </Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.textInput}
                        value={docNumber}
                        onChangeText={setDocNumber}
                        placeholder={
                          docType === 'GSTIN'
                            ? 'e.g. 19AAAAA0000A1Z5'
                            : docType === 'PAN'
                            ? 'e.g. ABCDE1234F'
                            : 'e.g. UDYAM-WB-09-0012345'
                        }
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  {/* Document Upload Button */}
                  <TouchableOpacity style={styles.docUploadBtn} onPress={handlePickDocument}>
                    <Text style={styles.docUploadIcon}>📎</Text>
                    <View style={styles.docUploadCol}>
                      <Text style={styles.docUploadTitle}>
                        {docFileName ? '✓ Document Attached' : `Attach ${docType} Document (PDF / Image)`}
                      </Text>
                      <Text style={styles.docUploadSub}>
                        {docFileName || 'Tap to choose file from phone storage'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleBusinessRegisterSubmit}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Verify and Submit Business Application</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setBusinessStep(1)}
                  >
                    <Text style={styles.secondaryBtnText}>‹ Back to Credentials</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Recognised by Startup India */}
        <View style={styles.startupBadgeRow}>
          <Text style={styles.startupLabel}>Recognised by </Text>
          <Text style={styles.startupHash}>#</Text>
          <Image source={require('../../assets/startupindia.png')} style={styles.startupLogo} resizeMode="contain" />
        </View>
      </ScrollView>

      {/* Server Settings Modal */}
      <ServerStatusModal visible={showServerModal} onClose={() => setShowServerModal(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    marginBottom: 18,
    marginTop: 4,
  },
  logo: {
    width: 200,
    height: 52,
  },
  roleSelectorCard: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  authModeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#F59E0B',
  },
  modeTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modeTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  subToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subToggleBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  subToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  subToggleTextActive: {
    color: '#B45309',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
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
  showPassText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  otpBox: {
    width: 48,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    textAlign: 'center',
    fontSize: 18,
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
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionSection: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#152238',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: '#152238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  secondaryBtnText: {
    color: '#152238',
    fontSize: 14,
    fontWeight: '700',
  },
  textLinkBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  textLink: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#F59E0B',
  },
  stepDotNum: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 6,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#112240',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  gpsRow: {
    marginBottom: 16,
  },
  gpsBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  gpsBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  mediaSection: {
    marginBottom: 18,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  mediaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  docSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  docSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  docSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  docTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  docTypeChipActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  docTypeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  docTypeChipTextActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  docUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  docUploadIcon: {
    fontSize: 22,
  },
  docUploadCol: {
    flex: 1,
  },
  docUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docUploadSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  startupBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
