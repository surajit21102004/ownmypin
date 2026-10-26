import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { TRANSLATIONS } from '../constants/translations';
import { getPinQrCodeUrl, getDigilockerStatus } from '../services/api';
import ProfileEditModal from '../components/ProfileEditModal';
import BusinessModal from '../components/BusinessModal';
import SubscriptionModal from '../components/SubscriptionModal';
import InviteModal from '../components/InviteModal';
import SocialProfilesModal from '../components/SocialProfilesModal';
import DigiLockerModal from '../components/DigiLockerModal';

const DIGILOCKER_LOGO = require('../../assets/digilocker.png');
import {
  AccountIcon,
  StoreIcon,
  ShareIcon,
  GlobeIcon,
  GiftIcon,
  ShieldLockIcon,
  ChevronRightIcon,
  StarIcon,
  VerifiedCheckIcon,
} from '../components/SvgIcons';

export default function AccountScreen({
  user,
  registration,
  lang = 'en',
  onSelectLang,
  onNavigateToRegister,
  onLogout,
  onUpdateRegistration,
}) {
  const isApproved =
    registration &&
    registration.status === 'approved' &&
    (registration.pin_code || registration.verified_pin_code);
  const isPending = registration && registration.status === 'pending';

  // Real user pins
  const userPins = [];
  if (isApproved) {
    userPins.push({
      id: 1,
      label: 'PIN 1',
      pin: registration.pin_code || registration.verified_pin_code,
    });
  }
  if (registration && registration.business_pin) {
    userPins.push({
      id: 2,
      label: 'PIN 2',
      pin: registration.business_pin,
    });
  }

  const [selectedPinTab, setSelectedPinTab] = useState(1); // 1 | 2
  const [privacyMode, setPrivacyMode] = useState(registration?.privacy_mode || false);
  const [isVip, setIsVip] = useState(false);

  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDigilockerModal, setShowDigilockerModal] = useState(false);
  const [liveVerified, setLiveVerified] = useState(false);
  const [liveVerifiedName, setLiveVerifiedName] = useState('');

  const targetPhone = (user && user.phone) || (registration && registration.phone) || '';

  useEffect(() => {
    if (!targetPhone) return;
    let isMounted = true;
    getDigilockerStatus(targetPhone)
      .then((res) => {
        if (isMounted && res && res.isVerified) {
          setLiveVerified(true);
          if (res.verifiedName) {
            setLiveVerifiedName(res.verifiedName);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [targetPhone]);

  const totalPinsCount = userPins.length;
  const activePinObj = userPins[selectedPinTab - 1] || userPins[0];
  const currentPin = activePinObj?.pin || null;

  const isDigilockerVerified = Boolean(
    liveVerified ||
    registration?.is_aadhaar_verified ||
    user?.is_aadhaar_verified ||
    registration?.digilocker_verified_at
  );
  const aadhaarName =
    liveVerifiedName ||
    registration?.aadhaar_verified_name ||
    user?.aadhaar_verified_name ||
    '';

  const fullName =
    (registration && registration.full_name) || (user && user.full_name) || 'Resident';
  const avatarUrl =
    (registration && (registration.selfie_url || registration.avatar_url)) || null;

  const languages = [
    { code: 'en', label: 'English', sub: 'Default' },
    { code: 'bn', label: 'বাংলা (Bengali)', sub: 'পশ্চিমবঙ্গ ও আঞ্চলিক' },
    { code: 'hi', label: 'हिन्दी (Hindi)', sub: 'राष्ट्रीय भाषा' },
  ];

  const handleSaveProfile = (updatedData) => {
    if (onUpdateRegistration) {
      onUpdateRegistration(updatedData);
    }
  };

  const handleTogglePrivacy = (val) => {
    setPrivacyMode(val);
    handleSaveProfile({ privacy_mode: val });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title (Matches Screenshot 4) */}
      <Text style={styles.pageTitle}>Account</Text>

      {/* 1. Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarBorderWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.profileInfoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.fullName}>{fullName}</Text>
            {isApproved && (
              <View style={styles.greenTickCircle}>
                <VerifiedCheckIcon size={10} color="#FFFFFF" />
              </View>
            )}
            {isDigilockerVerified && (
              <View style={styles.digilockerBadgePill}>
                <Image source={DIGILOCKER_LOGO} style={styles.dlMiniLogo} resizeMode="contain" />
                <Text style={styles.dlBadgeText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.metaBadgesRow}>
            <TouchableOpacity
              style={[styles.planBadgePill, isVip && styles.planBadgeVip]}
              onPress={() => setShowSubscription(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.planBadgeText, isVip && styles.planBadgeTextVip]}>
                {isVip ? 'VIP plan' : 'Free plan'}
              </Text>
            </TouchableOpacity>

            <View style={styles.ratingBadge}>
              <StarIcon size={12} color="#D97706" />
              <Text style={styles.ratingText}>
                {isApproved ? '4.8 · 24 ratings' : isPending ? 'Pending Review' : 'New User'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 1.5 DigiLocker Identity Verification Card */}
      {isDigilockerVerified ? (
        <View style={styles.digilockerSuccessCard}>
          <Image source={DIGILOCKER_LOGO} style={styles.dlCardLogo} resizeMode="contain" />
          <View style={styles.dlCardTextCol}>
            <View style={styles.dlVerifiedRow}>
              <Text style={styles.dlCardTitle}>Verified by DigiLocker</Text>
              <View style={styles.dlCheckCircle}>
                <Text style={styles.dlCheckMark}>✓</Text>
              </View>
            </View>
            <Text style={styles.dlCardSub}>Government of India Aadhaar Authenticated</Text>
            {aadhaarName ? (
              <Text style={styles.dlAadhaarNameText}>Name: {aadhaarName}</Text>
            ) : null}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.digilockerActionCard}
          activeOpacity={0.85}
          onPress={() => setShowDigilockerModal(true)}
        >
          <Image source={DIGILOCKER_LOGO} style={styles.dlCardLogo} resizeMode="contain" />
          <View style={styles.dlCardTextCol}>
            <View style={styles.dlActionTitleRow}>
              <Text style={styles.dlCardActionTitle}>DigiLocker Verification</Text>
              <View style={styles.dlTrustPill}>
                <Text style={styles.dlTrustPillText}>Earn Trust Badge</Text>
              </View>
            </View>
            <Text style={styles.dlCardActionSub}>
              Verify with Aadhaar via DigiLocker to earn the verified trust badge on your profile and PIN.
            </Text>
          </View>
          <View style={styles.dlVerifyBtnSmall}>
            <Text style={styles.dlVerifyBtnSmallText}>Verify</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 2. PIN Card with QR Code and Switcher (Matches Screenshot 4) */}
      <View style={styles.pinMasterCard}>
        {/* Top Header Row with Total PINs & Tabs */}
        <View style={styles.pinCardHeaderRow}>
          <Text style={styles.totalPinsText}>Total PINs: {totalPinsCount}</Text>
          {totalPinsCount > 1 ? (
            <View style={styles.pinTabsGroup}>
              {userPins.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.pinTabBtn,
                    selectedPinTab === idx + 1 && styles.pinTabBtnActive,
                  ]}
                  onPress={() => setSelectedPinTab(idx + 1)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pinTabText,
                      selectedPinTab === idx + 1 && styles.pinTabTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : totalPinsCount === 1 ? (
            <View style={styles.pinSingleBadge}>
              <Text style={styles.pinSingleBadgeText}>Verified PIN</Text>
            </View>
          ) : isPending ? (
            <View style={styles.pinPendingBadge}>
              <Text style={styles.pinPendingBadgeText}>In Review</Text>
            </View>
          ) : (
            <View style={styles.pinUnregisteredBadge}>
              <Text style={styles.pinUnregisteredBadgeText}>Not Registered</Text>
            </View>
          )}
        </View>

        {totalPinsCount > 0 && currentPin ? (
          <>
            {/* Center QR Code */}
            <View style={styles.qrCodeWrapper}>
              <Image
                source={{ uri: getPinQrCodeUrl(currentPin) }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            {/* Gold PIN Display */}
            <Text style={styles.goldPinText}>{currentPin}</Text>
          </>
        ) : isPending ? (
          <View style={styles.pinPendingContent}>
            <Text style={styles.pinPendingIcon}>⏳</Text>
            <Text style={styles.pinPendingTitle}>Application Under Review</Text>
            <Text style={styles.pinPendingDesc}>
              Your doorstep registration has been received and is being verified by the OwnMyPin team. Your official PIN and QR code will appear here once approved.
            </Text>
            <TouchableOpacity
              style={styles.trackApplicationBtn}
              activeOpacity={0.85}
              onPress={onNavigateToRegister}
            >
              <Text style={styles.trackApplicationBtnText}>Track Status / Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pinPendingContent}>
            <Text style={styles.pinPendingIcon}>📍</Text>
            <Text style={styles.pinPendingTitle}>No PIN Generated Yet</Text>
            <Text style={styles.pinPendingDesc}>
              Register your home or business address to generate your official OwnMyPin digital doorstep address.
            </Text>
            <TouchableOpacity
              style={styles.trackApplicationBtn}
              activeOpacity={0.85}
              onPress={onNavigateToRegister}
            >
              <Text style={styles.trackApplicationBtnText}>Register Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 3. Privacy Mode Toggle Card (Matches Screenshot 4) */}
      <View style={styles.privacyCard}>
        <View style={styles.privacyTextCol}>
          <Text style={styles.privacyTitle}>Privacy mode</Text>
          <Text style={styles.privacySub}>
            {privacyMode
              ? 'On: only people with your shared link can view your doorstep location'
              : 'Off: anyone can search and view your verified profile'}
          </Text>
        </View>
        <Switch
          value={privacyMode}
          onValueChange={handleTogglePrivacy}
          trackColor={{ false: '#CBD5E1', true: '#F59E0B' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* 4. Menu Items List (Matches Screenshot 4) */}
      <View style={styles.menuContainer}>
        {/* Profile edit */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowEditProfile(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconWrap}>
              <AccountIcon size={17} color="#0F172A" />
            </View>
            <Text style={styles.menuItemText}>Profile edit</Text>
          </View>
          <ChevronRightIcon size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* DigiLocker verification */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowDigilockerModal(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconWrap}>
              <Image source={DIGILOCKER_LOGO} style={{ width: 17, height: 17 }} resizeMode="contain" />
            </View>
            <Text style={styles.menuItemText}>DigiLocker verification</Text>
          </View>
          <View style={styles.menuRightBadgeWrap}>
            {isDigilockerVerified ? (
              <View style={styles.dlMenuVerifiedBadge}>
                <Text style={styles.dlMenuVerifiedText}>Verified ✓</Text>
              </View>
            ) : (
              <View style={styles.dlMenuPendingBadge}>
                <Text style={styles.dlMenuPendingText}>Verify now</Text>
              </View>
            )}
            <ChevronRightIcon size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* Create a business */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowBusiness(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconWrap}>
              <StoreIcon size={17} color="#0F172A" />
            </View>
            <Text style={styles.menuItemText}>Create a business</Text>
          </View>
          <ChevronRightIcon size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Add social media profiles */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowSocial(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconWrap}>
              <ShareIcon size={16} color="#0F172A" />
            </View>
            <Text style={styles.menuItemText}>Add social media profiles</Text>
          </View>
          <ChevronRightIcon size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* App language */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowLangModal(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconWrap}>
              <GlobeIcon size={17} color="#0F172A" />
            </View>
            <Text style={styles.menuItemText}>App language</Text>
          </View>
          <ChevronRightIcon size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Invite & Earn */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowInvite(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconWrap}>
              <GiftIcon size={17} color="#0F172A" />
            </View>
            <Text style={styles.menuItemText}>Invite & Earn</Text>
          </View>
          <View style={styles.menuRightBadgeWrap}>
            <View style={styles.vipRewardBadge}>
              <Text style={styles.vipRewardBadgeText}>3 months VIP</Text>
            </View>
            <ChevronRightIcon size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* Privacy policy */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          activeOpacity={0.7}
          onPress={() => setShowPrivacyModal(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconWrap}>
              <ShieldLockIcon size={17} color="#0F172A" />
            </View>
            <Text style={styles.menuItemText}>Privacy policy</Text>
          </View>
          <ChevronRightIcon size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 5. Upgrade to VIP Banner (Matches Screenshot 4) */}
      <View style={styles.upgradeBannerCard}>
        <View style={styles.upgradeBannerTextCol}>
          <Text style={styles.upgradeBannerTitle}>Upgrade to VIP</Text>
          <Text style={styles.upgradeBannerSub}>Move from Free to VIP</Text>
        </View>
        <TouchableOpacity
          style={styles.upgradeActionBtn}
          activeOpacity={0.85}
          onPress={() => setShowSubscription(true)}
        >
          <Text style={styles.upgradeActionBtnText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Option */}
      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.75} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>🚪 Log Out</Text>
      </TouchableOpacity>

      {/* Startup India Recognition Banner */}
      <View style={styles.startupFooter}>
        <Text style={styles.startupLabel}>Recognised by </Text>
        <Text style={styles.startupHash}>#</Text>
        <Image
          source={require('../../assets/startupindia.png')}
          style={styles.startupLogo}
          resizeMode="contain"
        />
      </View>

      {/* ------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------- */}
      <ProfileEditModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        registration={registration}
        onSaveProfile={handleSaveProfile}
      />

      <BusinessModal
        visible={showBusiness}
        onClose={() => setShowBusiness(false)}
        defaultAddress={registration?.address_line}
      />

      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
        isVip={isVip}
        onUpgradeSuccess={() => setIsVip(true)}
        onOpenInvite={() => setShowInvite(true)}
      />

      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        pin={currentPin || 'WB-09-45896524'}
      />

      <SocialProfilesModal
        visible={showSocial}
        onClose={() => setShowSocial(false)}
        initialProfiles={registration?.social_profiles || {}}
        onSave={(profiles) => {
          handleSaveProfile({ social_profiles: profiles });
        }}
      />

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
            <Text style={styles.modalTitle}>Choose App Language</Text>
            {languages.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langChoiceItem, lang === l.code && styles.langChoiceItemActive]}
                onPress={() => {
                  onSelectLang(l.code);
                  setShowLangModal(false);
                }}
              >
                <View>
                  <Text style={[styles.langChoiceText, lang === l.code && styles.langChoiceTextActive]}>
                    {l.label}
                  </Text>
                  <Text style={styles.langChoiceSub}>{l.sub}</Text>
                </View>
                {lang === l.code && <Text style={styles.checkTick}>✓</Text>}
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
          <View style={styles.modalCardLarge}>
            <Text style={styles.modalTitle}>OwnMyPin Privacy Policy</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              <Text style={styles.privacyBody}>
                OwnMyPin respects your personal privacy and doorstep security.{'\n\n'}
                1. Data Protection: Your GPS coordinates and doorstep documents are encrypted in transit and at rest.{'\n\n'}
                2. Privacy Mode: When enabled, your exact doorstep address is hidden from general directory searches and only shared with verified delivery personnel upon scanning your QR.{'\n\n'}
                3. Verification: Government ID and live selfies are used strictly for issuing certified digital addresses.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DigiLocker Verification Modal */}
      <DigiLockerModal
        visible={showDigilockerModal}
        onClose={() => setShowDigilockerModal(false)}
        phone={(user && user.phone) || (registration && registration.phone) || ''}
        userName={fullName}
        onVerificationSuccess={(data) => {
          handleSaveProfile({
            is_aadhaar_verified: 1,
            aadhaar_verified_name: data?.name || fullName,
          });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarBorderWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    padding: 2,
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#112240',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#F59E0B',
    fontSize: 26,
    fontWeight: '900',
  },
  profileInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  greenTickCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenTickText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planBadgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  planBadgeVip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  planBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  planBadgeTextVip: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    color: '#F59E0B',
    fontSize: 13,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  pinMasterCard: {
    backgroundColor: '#112240',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#112240',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pinCardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalPinsText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  pinTabsGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 3,
  },
  pinTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 13,
  },
  pinTabBtnActive: {
    backgroundColor: '#F59E0B',
  },
  pinTabText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  pinTabTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  pinSingleBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  pinSingleBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  pinPendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pinPendingBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  pinUnregisteredBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  pinUnregisteredBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  pinPendingContent: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: '100%',
  },
  pinPendingIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  pinPendingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  pinPendingDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  trackApplicationBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  trackApplicationBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  qrCodeWrapper: {
    width: 170,
    height: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  goldPinText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  privacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyTextCol: {
    flex: 1,
    marginRight: 12,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  privacySub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  chevron: {
    fontSize: 22,
    color: '#94A3B8',
    fontWeight: '400',
    marginLeft: 6,
  },
  menuRightBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipRewardBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipRewardBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  upgradeBannerCard: {
    backgroundColor: '#F59E0B',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  upgradeBannerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  upgradeBannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  upgradeBannerSub: {
    fontSize: 12,
    color: '#451A03',
    fontWeight: '700',
  },
  upgradeActionBtn: {
    backgroundColor: '#112240',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
  },
  upgradeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '700',
  },
  startupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  startupLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  startupHash: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '900',
  },
  startupLogo: {
    width: 100,
    height: 32,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalCardLarge: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  langChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langChoiceItemActive: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  langChoiceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  langChoiceTextActive: {
    color: '#D97706',
  },
  langChoiceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  checkTick: {
    color: '#D97706',
    fontSize: 16,
    fontWeight: '900',
  },
  privacyBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: '#112240',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  digilockerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
    gap: 4,
  },
  dlMiniLogo: {
    width: 14,
    height: 14,
  },
  dlBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3730A3',
  },
  digilockerSuccessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#A5B4FC',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  digilockerActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'solid',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dlCardLogo: {
    width: 44,
    height: 44,
    marginRight: 14,
  },
  dlCardTextCol: {
    flex: 1,
  },
  dlVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dlCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  dlCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlCheckMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  dlCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  dlAadhaarNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 3,
  },
  dlActionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  dlCardActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dlTrustPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dlTrustPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  dlCardActionSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  dlVerifyBtnSmall: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  dlVerifyBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dlMenuVerifiedBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dlMenuVerifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
  },
  dlMenuPendingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dlMenuPendingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
});
