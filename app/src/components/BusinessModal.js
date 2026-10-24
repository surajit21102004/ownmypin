import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

export default function BusinessModal({ visible, onClose, initialBusiness, defaultAddress }) {
  // Mode: 'create' | 'submitted' | 'dashboard'
  const [business, setBusiness] = useState(
    initialBusiness || {
      name: '',
      category: '',
      phone: '',
      address: defaultAddress || '',
      status: 'none', // 'none' | 'submitted' | 'verified'
      views: 142,
      adsRunning: 1,
      rating: 4.8,
    }
  );

  const [mode, setMode] = useState(() => {
    if (initialBusiness && initialBusiness.status === 'verified') return 'dashboard';
    if (initialBusiness && initialBusiness.status === 'submitted') return 'submitted';
    return 'create';
  });

  const [name, setName] = useState(business.name || '');
  const [category, setCategory] = useState(business.category || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || defaultAddress || '');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your business name.');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Required', 'Please enter or choose a business category.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your business phone number.');
      return;
    }

    const updated = {
      ...business,
      name: name.trim(),
      category: category.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Rishra, Hooghly',
      status: 'submitted',
    };
    setBusiness(updated);
    setMode('submitted');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>
              {mode === 'create'
                ? 'Create a business'
                : mode === 'submitted'
                ? 'Business submitted'
                : business.name || 'Business'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'create'
                ? 'Get a business PIN and the verified tick.'
                : mode === 'submitted'
                ? 'We are verifying your business.'
                : 'Business dashboard'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* --------------------------------------------------------- */}
          {/* SCREEN 1: CREATE A BUSINESS (Matches Screenshot 3 Screen 1) */}
          {/* --------------------------------------------------------- */}
          {mode === 'create' && (
            <View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Business name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Business name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Choose a category (e.g. Retail, Grocery, Cafe)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Business phone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Business address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Same as my PIN address or new"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  Submit for verification. After approval your business gets a PIN and the verified tick.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={handleSubmit}>
                <Text style={styles.primaryBtnText}>Submit for verification</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --------------------------------------------------------- */}
          {/* SCREEN 2: BUSINESS SUBMITTED (Matches Screenshot 3 Screen 2) */}
          {/* --------------------------------------------------------- */}
          {mode === 'submitted' && (
            <View>
              <View style={styles.stepperCard}>
                {/* Step 1: Submitted */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, styles.dotDone]}>
                    <Text style={styles.dotCheck}>✓</Text>
                  </View>
                  <View style={styles.stepMeta}>
                    <Text style={styles.stepTitle}>Submitted</Text>
                    <Text style={styles.stepSub}>{business.name || 'Business'} sent for verification</Text>
                  </View>
                </View>

                <View style={styles.stepLine} />

                {/* Step 2: Verification */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, styles.dotActive]}>
                    <View style={styles.dotPulse} />
                  </View>
                  <View style={styles.stepMeta}>
                    <Text style={[styles.stepTitle, { color: '#D97706' }]}>Verification</Text>
                    <Text style={styles.stepSub}>OwnMyPin team is checking your business</Text>
                  </View>
                </View>

                <View style={styles.stepLine} />

                {/* Step 3: Verified tick */}
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, styles.dotPending]}>
                    <Text style={styles.dotPendingText}>3</Text>
                  </View>
                  <View style={styles.stepMeta}>
                    <Text style={[styles.stepTitle, { color: '#94A3B8' }]}>
                      Business PIN and verified tick
                    </Text>
                    <Text style={styles.stepSub}>Then you can run ads</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={() => setMode('dashboard')}
              >
                <Text style={styles.primaryBtnText}>View Business Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={onClose}>
                <Text style={styles.secondaryBtnText}>Back to Account</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --------------------------------------------------------- */}
          {/* SCREEN 3: BUSINESS DASHBOARD (Matches Screenshot 3 Screen 3) */}
          {/* --------------------------------------------------------- */}
          {mode === 'dashboard' && (
            <View>
              {/* 3 Metric Cards */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{business.views || 142}</Text>
                  <Text style={styles.metricLabel}>Profile views</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{business.adsRunning || 1}</Text>
                  <Text style={styles.metricLabel}>Ads running</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{business.rating || 4.8}</Text>
                  <Text style={styles.metricLabel}>Rating</Text>
                </View>
              </View>

              {/* Verification Status Card */}
              <View style={styles.verificationCard}>
                <Text style={styles.verifTitle}>Verification</Text>
                <View style={styles.verifStatusRow}>
                  <Text style={styles.verifStatusLabel}>Status: </Text>
                  <Text style={styles.verifStatusVal}>
                    {business.status === 'submitted' ? 'Pending Review' : 'Verified ✓'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert('OwnMyPin Ads', 'Ad manager portal opened. Create and launch targeted doorstep ads.')
                }
              >
                <Text style={styles.primaryBtnText}>Run an ad with OwnMyPin Ads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={() => setMode('create')}
              >
                <Text style={styles.secondaryBtnText}>Edit business profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 24 : 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  backIcon: {
    fontSize: 26,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  primaryBtn: {
    backgroundColor: '#112240',
    borderRadius: 26,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#112240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    fontSize: 16,
    fontWeight: '900',
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
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  dotPendingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginLeft: 15,
    marginVertical: 4,
  },
  stepMeta: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 12,
    color: '#64748B',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
  },
  verifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  verifStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifStatusLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  verifStatusVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
});
