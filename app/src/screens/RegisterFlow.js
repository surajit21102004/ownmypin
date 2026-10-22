import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { submitRegistration, getMyRegistration } from '../services/api';

const { width } = Dimensions.get('window');

export default function RegisterFlow({
  phone,
  initialRegistration,
  onBackToHome,
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
  const [registration, setRegistration] = useState(initialRegistration);

  // Form State
  const [formData, setFormData] = useState({
    fullName: 'Rahul Sharma',
    dob: '15/08/2000',
    guardianName: '',
    propertyType: 'House',
    ownershipType: 'Own',
    addressLine: '42 Rabindra Sarani, Morepukur',
    state: 'West Bengal',
    stateCode: 'WB',
    district: 'Hooghly',
    districtCode: '09',
    city: 'Rishra',
    pincode: '712248',
    landmark: 'Near Hanuman Mandir',
    latitude: 22.7126,
    longitude: 88.3524,
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    propertyPhotos: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300',
    ],
    agreedToPolicy: true,
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

  const handleCaptureSelfie = () => {
    Alert.alert('Camera Opened', 'Selfie captured successfully with in-app camera verification.');
    setFormData((prev) => ({
      ...prev,
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    }));
  };

  const handleAddPhoto = () => {
    if (formData.propertyPhotos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 property photos.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      propertyPhotos: [
        ...prev.propertyPhotos,
        `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300`,
      ],
    }));
    Alert.alert('Photo Added', 'Property photo added to list.');
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
      setRegistration({
        ...payload,
        id: res.registrationId,
        status: 'pending',
      });
      setScreenMode('submitted');
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

          <Text style={styles.readyTitle}>Your OwnMyPin is ready</Text>
          <Text style={styles.readySubtitle}>Created after your registration was verified.</Text>

          {/* Dark Navy DIGIPIN Card */}
          <View style={styles.digipinCard}>
            <Text style={styles.applicantHeaderName}>
              [{registration?.full_name || formData.fullName}]
            </Text>

            <Text style={styles.digipinCode}>{pin}</Text>

            {/* Simulated QR Code Box */}
            <View style={styles.qrContainer}>
              <View style={styles.qrInner}>
                <Text style={styles.qrLabel}>[QR code]</Text>
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

            {/* Map Preview Box */}
            <View style={styles.mapBox}>
              <Text style={styles.mapPinIcon}>📍</Text>
              <Text style={styles.mapTitle}>[Google Map preview]</Text>
              <Text style={styles.mapCoords}>
                Lat: {formData.latitude}° N, Lng: {formData.longitude}° E
              </Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ GPS Location Calibrated</Text>
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
                <Text style={styles.selfieEmoji}>🤳</Text>
              </View>
              <TouchableOpacity style={styles.cameraBtn} onPress={handleCaptureSelfie}>
                <Text style={styles.cameraBtnText}>Open camera</Text>
              </TouchableOpacity>
              <Text style={styles.selfieNote}>
                Selfie must be taken in the app. Gallery upload is not allowed.
              </Text>
            </View>

            {/* Property Photos Grid */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Property photos (up to 5)</Text>
              <View style={styles.photosGrid}>
                {formData.propertyPhotos.map((_, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Text style={styles.photoThumbText}>Photo {i + 1}</Text>
                  </View>
                ))}
                {formData.propertyPhotos.length < 5 && (
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
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
                <Text style={styles.reviewVal}>[{formData.fullName}]</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Date of birth:</Text>
                <Text style={styles.reviewVal}>[{formData.dob}]</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Property:</Text>
                <Text style={styles.reviewVal}>
                  [{formData.propertyType}] • [{formData.ownershipType}]
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Address:</Text>
                <Text style={styles.reviewVal} numberOfLines={2}>
                  [{formData.addressLine}, {formData.city}, {formData.state} {formData.pincode}]
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
                  Selfie + [{formData.propertyPhotos.length}] property photos
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
  mapBox: {
    height: 140,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
  },
  mapPinIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  mapCoords: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    marginBottom: 6,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  selfieContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  selfieCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoThumb: {
    width: (width - 70) / 3,
    height: 75,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  photoThumbText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  addPhotoBtn: {
    width: (width - 70) / 3,
    height: 75,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    color: '#FFFFFF',
    fontSize: 13,
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
  readyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
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
});
