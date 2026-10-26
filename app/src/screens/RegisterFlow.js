import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { submitRegistration, getMyRegistration, uploadImageToServer } from '../services/api';
import DigiLockerModal from '../components/DigiLockerModal';

const DIGILOCKER_LOGO = require('../../assets/digilocker.png');

const { width } = Dimensions.get('window');

const getLeafletHtml = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #f8fafc;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #map {
      width: 100%;
      height: 100%;
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255,255,255,0.75) !important;
    }
    .custom-pulse-pin {
      background: #152238;
      border: 3px solid #F59E0B;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      position: relative;
    }
    .custom-pulse-pin::after {
      content: '';
      position: absolute;
      top: -6px;
      left: -6px;
      right: -6px;
      bottom: -6px;
      border-radius: 50%;
      border: 2px solid #F59E0B;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .map-hint {
      position: absolute;
      bottom: 8px;
      left: 8px;
      z-index: 1000;
      background: rgba(21, 34, 56, 0.9);
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      pointer-events: none;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="map-hint">📍 Drag pin or tap map to calibrate</div>
  <script>
    var lat = ${lat || 22.7126};
    var lng = ${lng || 88.3524};
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'custom-pulse-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    var marker = L.marker([lat, lng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    marker.bindPopup('<b>Doorstep Location</b><br>Lat: ' + lat.toFixed(5) + '<br>Lng: ' + lng.toFixed(5)).openPopup();

    function notifyNative(newLat, newLng) {
      marker.setLatLng([newLat, newLng]);
      marker.setPopupContent('<b>Doorstep Location</b><br>Lat: ' + newLat.toFixed(5) + '<br>Lng: ' + newLng.toFixed(5));
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          latitude: parseFloat(newLat.toFixed(6)),
          longitude: parseFloat(newLng.toFixed(6))
        }));
      }
    }

    marker.on('dragend', function(e) {
      var coord = e.target.getLatLng();
      notifyNative(coord.lat, coord.lng);
    });

    map.on('click', function(e) {
      notifyNative(e.latlng.lat, e.latlng.lng);
    });
  </script>
</body>
</html>
`;

export default function RegisterFlow({
  phone,
  initialRegistration,
  onBackToHome,
  onRegistrationSubmitted,
}) {
  // Current screen mode: 'flow' (steps 1-5), 'submitted' (tracker), 'ready' (approved PIN)
  const [screenMode, setScreenMode] = useState(() => {
    if (initialRegistration) {
      if (initialRegistration.status === 'approved') return 'ready';
      return 'submitted';
    }
    return 'flow';
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [registration, setRegistration] = useState(initialRegistration);
  const [showDigilockerModal, setShowDigilockerModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: initialRegistration?.full_name || '',
    dob: initialRegistration?.dob || '',
    guardianName: initialRegistration?.guardian_name || '',
    propertyType: initialRegistration?.property_type || 'House',
    ownershipType: initialRegistration?.ownership_type || 'Own',
    addressLine: initialRegistration?.address_line || '',
    state: initialRegistration?.state || 'West Bengal',
    stateCode: initialRegistration?.state_code || 'WB',
    district: initialRegistration?.district || 'Hooghly',
    districtCode: initialRegistration?.district_code || '09',
    city: initialRegistration?.city || '',
    pincode: initialRegistration?.pincode || '',
    landmark: initialRegistration?.landmark || '',
    latitude: initialRegistration?.latitude || 22.7126,
    longitude: initialRegistration?.longitude || 88.3524,
    selfieUrl: initialRegistration?.selfie_url || null,
    propertyPhotos: initialRegistration?.property_photos || [],
    agreedToPolicy: false,
  });

  const propertyTypes = ['House', 'Flat', 'Shop', 'Other'];
  const ownershipTypes = ['Own', 'Rent', 'Other'];

  const calculateAge = (dobString) => {
    if (!dobString) return 24;
    const parts = dobString.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const year = parseInt(parts[2], 10);
      if (!isNaN(year)) {
        return new Date().getFullYear() - year;
      }
    }
    return 24;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        Alert.alert('Required', 'Please enter your full name as on government ID.');
        return;
      }
      if (!formData.dob.trim()) {
        Alert.alert('Required', 'Please enter your date of birth.');
        return;
      }
      const age = calculateAge(formData.dob);
      if (age < 16) {
        Alert.alert('Age Limit', 'You must be at least 16 years old to register.');
        return;
      }
      if (age >= 16 && age < 18 && !formData.guardianName.trim()) {
        Alert.alert('Guardian Required', 'Guardian full name is mandatory for applicants under 18.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.addressLine.trim() || !formData.city.trim() || !formData.pincode.trim()) {
        Alert.alert('Required', 'Please fill in your address line, city, and 6-digit PIN code.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBackToHome();
    }
  };

  // Auto-Detect Current GPS Location & Geocode
  const handleDetectLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        Alert.alert('Permission Denied', 'Location permission is required to detect your doorstep GPS.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const newLat = parseFloat(loc.coords.latitude.toFixed(6));
      const newLng = parseFloat(loc.coords.longitude.toFixed(6));

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: newLat,
          longitude: newLng,
        });
        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          setFormData((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
            city: prev.city || place.city || place.subregion || '',
            district: prev.district || place.district || place.subregion || 'Hooghly',
            state: prev.state || place.region || 'West Bengal',
            pincode: prev.pincode || place.postalCode || '',
            addressLine: prev.addressLine || [place.name, place.street].filter(Boolean).join(', ') || prev.addressLine,
          }));
          setIsLocating(false);
          Alert.alert('GPS Calibrated', `Doorstep coordinates calibrated:\nLat: ${newLat}, Lng: ${newLng}`);
          return;
        }
      } catch (e) {
        // reverse geocode optional fallback
      }

      setFormData((prev) => ({
        ...prev,
        latitude: newLat,
        longitude: newLng,
      }));
      setIsLocating(false);
      Alert.alert('GPS Calibrated', `Doorstep coordinates calibrated:\nLat: ${newLat}, Lng: ${newLng}`);
    } catch (err) {
      setIsLocating(false);
      Alert.alert('GPS Error', err.message || 'Could not fetch current location.');
    }
  };

  // 1. Capture Live Selfie using Device Camera
  const handleCaptureSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture live selfie.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType?.front || 'front',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploadingSelfie(true);
        const uploadedUrl = await uploadImageToServer(asset.uri, 'selfie', asset.base64);
        setIsUploadingSelfie(false);

        setFormData((prev) => ({
          ...prev,
          selfieUrl: uploadedUrl,
        }));
        Alert.alert('Success', 'Live selfie captured & uploaded successfully!');
      }
    } catch (err) {
      setIsUploadingSelfie(false);
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  };

  // 2. Pick Property Photo from Device Storage / Gallery or Camera
  const handleAddPhoto = async () => {
    if (formData.propertyPhotos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 property photos.');
      return;
    }

    Alert.alert(
      'Add Property Photo',
      'Select photo source:',
      [
        {
          text: '📁 Pick from Storage / Gallery',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Storage permission is required to select photos.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.7,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setIsUploadingPhoto(true);
                const uploadedUrl = await uploadImageToServer(asset.uri, 'property', asset.base64);
                setIsUploadingPhoto(false);

                setFormData((prev) => ({
                  ...prev,
                  propertyPhotos: [...prev.propertyPhotos, uploadedUrl],
                }));
              }
            } catch (err) {
              setIsUploadingPhoto(false);
              Alert.alert('Storage Error', err.message || 'Could not pick image.');
            }
          },
        },
        {
          text: '📷 Take Live Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.7,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setIsUploadingPhoto(true);
                const uploadedUrl = await uploadImageToServer(asset.uri, 'property', asset.base64);
                setIsUploadingPhoto(false);

                setFormData((prev) => ({
                  ...prev,
                  propertyPhotos: [...prev.propertyPhotos, uploadedUrl],
                }));
              }
            } catch (err) {
              setIsUploadingPhoto(false);
              Alert.alert('Camera Error', err.message || 'Could not open camera.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemovePhoto = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      propertyPhotos: prev.propertyPhotos.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.agreedToPolicy) {
      Alert.alert('Policy Agreement', 'Please check the box to agree to the Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      phone,
      full_name: formData.fullName,
      dob: formData.dob,
      guardian_name: formData.guardianName || null,
      property_type: formData.propertyType,
      ownership_type: formData.ownershipType,
      address_line: formData.addressLine,
      state: formData.state,
      state_code: formData.stateCode,
      district: formData.district,
      district_code: formData.districtCode,
      city: formData.city,
      pincode: formData.pincode,
      landmark: formData.landmark,
      latitude: formData.latitude,
      longitude: formData.longitude,
      selfie_url: formData.selfieUrl,
      property_photos: formData.propertyPhotos,
    };

    const res = await submitRegistration(payload);
    setIsSubmitting(false);

    if (res.success) {
      const newReg = {
        ...payload,
        id: res.registrationId,
        status: 'pending',
      };
      setRegistration(newReg);
      setScreenMode('submitted');
      // Prompt user with DigiLocker verification (with skip option)
      setShowDigilockerModal(true);
      if (onRegistrationSubmitted) {
        onRegistrationSubmitted(newReg);
      }
    } else {
      Alert.alert('Submission Error', res.message || 'Could not submit registration.');
    }
  };

  const handleRefreshStatus = async () => {
    const res = await getMyRegistration(phone);
    if (res.success && res.registration) {
      setRegistration(res.registration);
      if (res.registration.status === 'approved') {
        setScreenMode('ready');
      } else {
        Alert.alert(
          'Application Status',
          `Current status: ${res.registration.status.toUpperCase()}.\nAdmin review is in progress.`
        );
      }
    } else {
      Alert.alert('Status Check', 'Your application is under review by the OwnMyPin team.');
    }
  };

  const renderDigilockerModal = () => (
    <DigiLockerModal
      visible={showDigilockerModal}
      onClose={() => setShowDigilockerModal(false)}
      phone={phone}
      userName={formData.fullName}
      onVerificationSuccess={(data) => {
        setRegistration((prev) => ({
          ...prev,
          is_aadhaar_verified: 1,
          aadhaar_verified_name: data?.name || formData.fullName,
        }));
        if (onRegistrationSubmitted) {
          onRegistrationSubmitted({
            ...(registration || {}),
            is_aadhaar_verified: 1,
            aadhaar_verified_name: data?.name || formData.fullName,
          });
        }
      }}
    />
  );

  // -------------------------------------------------------------
  // SCREEN 7: YOUR OWNMIPIN IS READY
  // -------------------------------------------------------------
  if (screenMode === 'ready') {
    const pin = (registration && (registration.pin_code || registration.verified_pin_code)) || 'WB-09-45896524';
    const pinParts = pin.split('-');
    const statePart = pinParts[0] || 'WB';
    const districtPart = pinParts[1] || '09';
    const uniquePart = pinParts[2] || '45896524';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.readyContent} showsVerticalScrollIndicator={false}>
          {/* Big Green Checkmark */}
          <View style={styles.successIconCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>

          <View style={styles.readyTitleRow}>
            <Text style={styles.readyTitlePrefix}>Your </Text>
            <Image
              source={require('../../assets/ownmypin.png')}
              style={styles.readyLogo}
              resizeMode="contain"
            />
            <Text style={styles.readyTitlePrefix}> is ready</Text>
          </View>
          <Text style={styles.readySubtitle}>Created after your registration was verified.</Text>

          {/* Dark Navy DIGIPIN Card */}
          <View style={styles.digipinCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <Text style={styles.applicantHeaderName}>
                {registration?.full_name || formData.fullName}
              </Text>
              {registration?.is_aadhaar_verified && (
                <View style={styles.readyDigilockerBadge}>
                  <Image source={DIGILOCKER_LOGO} style={{ width: 14, height: 14, marginRight: 5 }} resizeMode="contain" />
                  <Text style={styles.readyDigilockerText}>Verified by DigiLocker</Text>
                </View>
              )}
            </View>

            <Text style={styles.digipinCode}>{pin}</Text>

            {/* Simulated QR Code Box */}
            <View style={styles.qrContainer}>
              <View style={styles.qrInner}>
                <Text style={styles.qrLabel}>Scan QR</Text>
                <View style={styles.qrDots}>
                  <View style={styles.qrCornerTopLeft} />
                  <View style={styles.qrCornerTopRight} />
                  <View style={styles.qrCornerBottomLeft} />
                  <Text style={styles.qrPinWatermark}>📌</Text>
                </View>
              </View>
            </View>

            {/* DIGIPIN Breakdown Tags */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownTag}>
                <Text style={styles.tagText}>{statePart} - State</Text>
              </View>
              <View style={styles.breakdownTag}>
                <Text style={styles.tagText}>{districtPart} - District</Text>
              </View>
              <View style={styles.breakdownTag}>
                <Text style={styles.tagText}>Unique code</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => Alert.alert('Share', `Sharing OwnMyPin: ${pin}`)}
          >
            <Text style={styles.primaryBtnText}>Share QR code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => Alert.alert('Google Maps', `Opening coordinates ${formData.latitude}, ${formData.longitude}`)}
          >
            <Text style={styles.secondaryBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textButton} onPress={onBackToHome}>
            <Text style={styles.textButtonLabel}>Back to Welcome Screen</Text>
          </TouchableOpacity>
        </ScrollView>

        {renderDigilockerModal()}
      </View>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 6: REGISTRATION SUBMITTED
  // -------------------------------------------------------------
  if (screenMode === 'submitted') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.submittedContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.submittedTitle}>Registration submitted</Text>
          <Text style={styles.submittedSubtitle}>
            We are verifying your details. Your PIN is created only after verification.
          </Text>

          {/* Verification Status Stepper Card */}
          <View style={styles.stepperCard}>
            {/* Step 1: Submitted (Done) */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.dotDone]}>
                <Text style={styles.dotCheck}>✓</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Submitted</Text>
                <Text style={styles.stepDesc}>Your details and photos are sent</Text>
              </View>
            </View>
            <View style={styles.stepLineDone} />

            {/* Step 2: Under review (In progress) */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.dotActive]}>
                <View style={styles.dotPulse} />
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitleActive}>Under review</Text>
                <Text style={styles.stepDesc}>OwnMyPin team is checking your registration</Text>
              </View>
            </View>
            <View style={styles.stepLine} />

            {/* Step 3: PIN created (Pending) */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.dotPending]} />
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitlePending}>PIN created</Text>
                <Text style={styles.stepDesc}>You get a notification when approved</Text>
              </View>
            </View>
          </View>

          {/* DigiLocker Identity Verification Prompt */}
          {registration?.is_aadhaar_verified ? (
            <View style={styles.dlSubmittedVerifiedCard}>
              <Image source={DIGILOCKER_LOGO} style={{ width: 36, height: 36, marginRight: 12 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.dlSubmittedVerifiedTitle}>Verified by DigiLocker</Text>
                  <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 14 }}>✓</Text>
                </View>
                <Text style={styles.dlSubmittedVerifiedSub}>
                  Government Aadhaar Authenticated ({registration.aadhaar_verified_name || formData.fullName})
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.dlSubmittedActionCard}>
              <View style={styles.dlSubmitRow}>
                <Image source={DIGILOCKER_LOGO} style={{ width: 44, height: 44, marginRight: 12 }} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={styles.dlSubmitCardTitle}>DigiLocker Verification</Text>
                    <View style={styles.dlTrustTag}>
                      <Text style={styles.dlTrustTagText}>Optional</Text>
                    </View>
                  </View>
                  <Text style={styles.dlSubmitCardSub}>
                    Verify with Aadhaar to earn the official DigiLocker badge on your profile and get instant trust.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.dlSubmitBtn}
                activeOpacity={0.85}
                onPress={() => setShowDigilockerModal(true)}
              >
                <Text style={styles.dlSubmitBtnText}>Verify with DigiLocker Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Admin Notice Callout */}
          <View style={styles.adminTipBox}>
            <Text style={styles.adminTipTitle}>💡 Admin Verification Notice</Text>
            <Text style={styles.adminTipBody}>
              You can approve this pending application directly in the Admin Panel at:{'\n'}
              <Text style={{ fontWeight: '700' }}>http://localhost:5000/admin</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRefreshStatus}>
            <Text style={styles.primaryBtnText}>🔄 Check Status / Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onBackToHome}>
            <Text style={styles.secondaryBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </ScrollView>

        {renderDigilockerModal()}
      </View>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION FLOW (STEPS 1 - 5)
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Top Header & Progress Bar */}
      <View style={styles.stepHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackStep}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.stepCounterText}>Step {currentStep} of 5</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Amber/Orange Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${(currentStep / 5) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.flowContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Name and date of birth */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.stepTitleMain}>Name and date of birth</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full name (as on government ID)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.fullName}
                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                placeholder="Full name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of birth (minimum age 16)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.dob}
                onChangeText={(t) => setFormData({ ...formData, dob: t })}
                placeholder="DD / MM / YYYY"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Guardian's full name (as per government ID)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.guardianName}
                onChangeText={(t) => setFormData({ ...formData, guardianName: t })}
                placeholder="Required if age 16-18, optional for 18+"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        )}

        {/* STEP 2: Property and ownership */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.stepTitleMain}>Property and ownership</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Property type</Text>
              <View style={styles.chipsRow}>
                {propertyTypes.map((type) => {
                  const isSelected = formData.propertyType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, propertyType: type })}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ownership type</Text>
              <View style={styles.chipsRow}>
                {ownershipTypes.map((type) => {
                  const isSelected = formData.ownershipType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, ownershipType: type })}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Address and location */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.stepTitleMain}>Address and location</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Address line</Text>
              <TextInput
                style={styles.textInput}
                value={formData.addressLine}
                onChangeText={(t) => setFormData({ ...formData, addressLine: t })}
                placeholder="House / street"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.state}
                  onChangeText={(t) => setFormData({ ...formData, state: t })}
                  placeholder="State"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>District</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.district}
                  onChangeText={(t) => setFormData({ ...formData, district: t })}
                  placeholder="District"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.city}
                  onChangeText={(t) => setFormData({ ...formData, city: t })}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>PIN code</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.pincode}
                  onChangeText={(t) => setFormData({ ...formData, pincode: t })}
                  placeholder="6 digits"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Landmark</Text>
              <TextInput
                style={styles.textInput}
                value={formData.landmark}
                onChangeText={(t) => setFormData({ ...formData, landmark: t })}
                placeholder="Nearby landmark"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* OpenStreetMap Leaflet Doorstep Preview */}
            <View style={styles.mapContainer}>
              <View style={styles.mapHeaderRow}>
                <View style={styles.mapTitleCol}>
                  <Text style={styles.mapSectionTitle}>🗺️ OpenStreetMap Doorstep Preview</Text>
                  <Text style={styles.mapSectionSubtitle}>
                    Lat: {formData.latitude}° N, Lng: {formData.longitude}° E
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.gpsDetectBtn}
                  onPress={handleDetectLocation}
                  disabled={isLocating}
                  activeOpacity={0.8}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.gpsDetectIcon}>🎯</Text>
                      <Text style={styles.gpsDetectText}>Detect GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.leafletWebviewWrapper}>
                <WebView
                  key={`osm-${formData.latitude}-${formData.longitude}`}
                  originWhitelist={['*']}
                  source={{ html: getLeafletHtml(formData.latitude, formData.longitude) }}
                  style={styles.leafletWebview}
                  scrollEnabled={false}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.latitude && data.longitude) {
                        setFormData((prev) => ({
                          ...prev,
                          latitude: data.latitude,
                          longitude: data.longitude,
                        }));
                      }
                    } catch (e) {
                      // ignore parse errors
                    }
                  }}
                />
              </View>

              <View style={styles.mapFooterNote}>
                <Text style={styles.mapFooterText}>
                  💡 Powered by OpenStreetMap (Free Leaflet). Drag pin or tap map to calibrate your exact doorstep location.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: Selfie and property photos */}
        {currentStep === 4 && (
          <View>
            <Text style={styles.stepTitleMain}>Selfie and property photos</Text>

            {/* Selfie Section */}
            <View style={styles.selfieContainer}>
              <View style={styles.selfieCircle}>
                {isUploadingSelfie ? (
                  <ActivityIndicator size="small" color="#152238" />
                ) : formData.selfieUrl ? (
                  <Image source={{ uri: formData.selfieUrl }} style={styles.selfieImage} />
                ) : (
                  <Text style={styles.selfieEmoji}>🤳</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.cameraBtn, isUploadingSelfie && styles.buttonDisabled]}
                onPress={handleCaptureSelfie}
                disabled={isUploadingSelfie}
              >
                <Text style={styles.cameraBtnText}>
                  {formData.selfieUrl ? '🔄 Retake live selfie' : '📷 Open camera'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.selfieNote}>
                Selfie must be taken in the app. Gallery upload is not allowed.
              </Text>
            </View>

            {/* Property Photos Grid */}
            <View style={styles.fieldGroup}>
              <View style={styles.photoHeaderRow}>
                <Text style={styles.fieldLabel}>Property photos (up to 5)</Text>
                <Text style={styles.photoCountBadge}>{formData.propertyPhotos.length}/5</Text>
              </View>

              <View style={styles.photosGrid}>
                {formData.propertyPhotos.map((photoUri, i) => (
                  <View key={i} style={styles.photoThumbCard}>
                    <Image source={{ uri: photoUri }} style={styles.photoThumbImg} />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => handleRemovePhoto(i)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removePhotoText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {isUploadingPhoto && (
                  <View style={[styles.photoThumb, styles.photoUploading]}>
                    <ActivityIndicator size="small" color="#F59E0B" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}

                {formData.propertyPhotos.length < 5 && !isUploadingPhoto && (
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
                    <Text style={styles.addPhotoIcon}>📁</Text>
                    <Text style={styles.addPhotoText}>+ Add photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* STEP 5: Review and submit */}
        {currentStep === 5 && (
          <View>
            <Text style={styles.stepTitleMain}>Review and submit</Text>

            {/* Summary Review Card */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Name:</Text>
                <Text style={styles.reviewVal}>{formData.fullName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Date of birth:</Text>
                <Text style={styles.reviewVal}>{formData.dob}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Property:</Text>
                <Text style={styles.reviewVal}>
                  {formData.propertyType} • {formData.ownershipType}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Address:</Text>
                <Text style={styles.reviewVal} numberOfLines={2}>
                  {formData.addressLine}, {formData.city}, {formData.state} {formData.pincode}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Location:</Text>
                <Text style={[styles.reviewVal, { color: '#10B981', fontWeight: '700' }]}>
                  Verified
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Photos:</Text>
                <Text style={styles.reviewVal}>
                  Selfie + {formData.propertyPhotos.length} property photos
                </Text>
              </View>
            </View>

            {/* Privacy Policy Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, agreedToPolicy: !formData.agreedToPolicy })}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, formData.agreedToPolicy && styles.checkboxActive]}>
                {formData.agreedToPolicy && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I agree to the Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View style={styles.bottomBar}>
        {currentStep < 5 ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {renderDigilockerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: '#0F172A',
    lineHeight: 30,
    marginTop: -2,
  },
  stepCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B', // Amber progress indicator matching design
  },
  flowContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  stepTitleMain: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  mapSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  mapSectionSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '600',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152238',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  gpsDetectIcon: {
    fontSize: 13,
  },
  gpsDetectText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  leafletWebviewWrapper: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  leafletWebview: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  mapFooterNote: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mapFooterText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  selfieContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  selfieCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  selfieEmoji: {
    fontSize: 36,
  },
  cameraBtn: {
    backgroundColor: '#152238',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selfieNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoThumbCard: {
    width: (width - 70) / 3,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
  photoThumb: {
    width: (width - 70) / 3,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  photoUploading: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  uploadingText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
    marginTop: 4,
  },
  addPhotoBtn: {
    width: (width - 70) / 3,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoIcon: {
    fontSize: 18,
  },
  addPhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    gap: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  reviewVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '65%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#152238',
    borderColor: '#152238',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    marginBottom: 12,
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
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: '#152238',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submittedContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  submittedTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  submittedSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 28,
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: '#10B981',
  },
  dotCheck: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  dotActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  dotPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
  },
  dotPending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  stepLineDone: {
    width: 2,
    height: 24,
    backgroundColor: '#10B981',
    marginLeft: 15,
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginLeft: 15,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepTitleActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
  stepTitlePending: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  adminTipBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 24,
  },
  adminTipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  adminTipBody: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18,
  },
  readyContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  readyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  readyTitlePrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  readyLogo: {
    width: 130,
    height: 34,
    marginHorizontal: 4,
  },
  readySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  digipinCard: {
    width: '100%',
    backgroundColor: '#152238',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#152238',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  applicantHeaderName: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 10,
  },
  digipinCode: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F59E0B', // Vibrant gold DIGIPIN
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 18,
  },
  qrContainer: {
    width: 170,
    height: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrInner: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0F172A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  qrDots: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  qrPinWatermark: {
    fontSize: 28,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  breakdownTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  textButton: {
    marginTop: 8,
    padding: 8,
  },
  textButtonLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  dlSubmittedVerifiedCard: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  dlSubmittedVerifiedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#312E81',
  },
  dlSubmittedVerifiedSub: {
    fontSize: 12,
    color: '#4338CA',
    marginTop: 2,
    lineHeight: 16,
  },
  dlSubmittedActionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dlSubmitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dlSubmitCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dlTrustTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dlTrustTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  dlSubmitCardSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  dlSubmitBtn: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dlSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  readyDigilockerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  readyDigilockerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
