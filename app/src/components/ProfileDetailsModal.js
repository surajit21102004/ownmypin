import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Share,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';

export default function ProfileDetailsModal({
  visible,
  onClose,
  profile,
  lang = 'en',
  isDirectShare = false,
}) {
  const t = TRANSLATIONS[lang]?.profileModal || TRANSLATIONS.en.profileModal;

  if (!profile) return null;

  const isPrivacyLocked = (profile.privacy_mode || profile.privacyMode) && !profile.isDirectShare && !isDirectShare;
  const social = profile.social_profiles || profile.socialProfiles || null;
  const hasSocial = social && (social.whatsapp || social.instagram || social.facebook || social.website);

  const handleOpenMaps = () => {
    if (isPrivacyLocked) {
      alert('🔒 Coordinates Protected: This resident has enabled Privacy Mode. Direct verified QR share is required to navigate.');
      return;
    }
    const lat = profile.latitude || 22.7126;
    const lng = profile.longitude || 88.3524;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Verified OwnMyPin: ${profile.pin}\nName: ${profile.fullName}\nLocation: ${profile.location}\nAddress: ${profile.addressLine}, ${profile.city}, ${profile.pincode}\nNavigate: https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t.title}</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Applicant Avatar & Pin Display */}
            <View style={styles.topProfileCard}>
              <View style={styles.avatarWrap}>
                {profile.selfieUrl ? (
                  <Image source={{ uri: profile.selfieUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {(profile.fullName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.verifiedBadgeCircle}>
                  <Text style={styles.badgeCheck}>✓</Text>
                </View>
              </View>

              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{profile.fullName}</Text>
                <View style={styles.pinPill}>
                  <Text style={styles.pinText}>{profile.pin}</Text>
                </View>
                <View style={styles.pinBreakdownMiniRow}>
                  <View style={styles.pinMiniChip}>
                    <Text style={styles.pinMiniChipText}>{(profile.pin || '').split('-')[0] || 'WB'} · State</Text>
                  </View>
                  <View style={styles.pinMiniChip}>
                    <Text style={styles.pinMiniChipText}>{(profile.pin || '').split('-')[1] || '09'} · District</Text>
                  </View>
                  <View style={styles.pinMiniChip}>
                    <Text style={styles.pinMiniChipText}>{(profile.pin || '').split('-')[2] || 'Unique'} · PIN</Text>
                  </View>
                </View>
                <Text style={styles.locationSummary}>📍 {profile.location}</Text>
                <Text style={styles.ratingText}>★ {profile.rating || '4.8'} (Official Verification)</Text>
              </View>
            </View>

            {/* Privacy Mode Notice (if locked) */}
            {isPrivacyLocked && (
              <View style={styles.privacyNoticeCard}>
                <Text style={styles.privacyNoticeTitle}>🔒 Privacy Mode Protected</Text>
                <Text style={styles.privacyNoticeText}>
                  This resident has enabled Privacy Mode. Exact house coordinates and doorstep routing are protected from public search. They can only be accessed when the owner directly shares their verified QR code or link.
                </Text>
              </View>
            )}

            {/* Address Details Card */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>🏠 {t.addressDetails}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {isPrivacyLocked ? 'Protected (Privacy Mode Active)' : (profile.addressLine || 'N/A')}
                </Text>
              </View>
              {profile.landmark && !isPrivacyLocked ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.landmark}</Text>
                  <Text style={styles.infoValue}>{profile.landmark}</Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>City / District</Text>
                <Text style={styles.infoValue}>
                  {profile.city}, {profile.district}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State & PIN</Text>
                <Text style={styles.infoValue}>
                  {profile.state} - {profile.pincode}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.propertyType}</Text>
                <Text style={styles.infoValue}>
                  {profile.propertyType || 'House'} ({profile.ownershipType || 'Own'})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.coordinates}</Text>
                <Text style={styles.coordsValue}>
                  {isPrivacyLocked
                    ? 'Protected (Direct QR Access Only)'
                    : `${profile.latitude?.toFixed(6)}, ${profile.longitude?.toFixed(6)}`}
                </Text>
              </View>
            </View>

            {/* Social Media Links Card */}
            {hasSocial && (
              <View style={styles.infoCard}>
                <Text style={styles.cardHeaderTitle}>🌐 Social Media & Profiles</Text>
                <View style={styles.socialPillsRow}>
                  {social.whatsapp ? (
                    <TouchableOpacity
                      style={[styles.socialPill, { backgroundColor: '#10B981' }]}
                      onPress={() => {
                        const cleanPhone = social.whatsapp.replace(/[^0-9]/g, '');
                        Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {});
                      }}
                    >
                      <Text style={styles.socialPillText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  ) : null}

                  {social.instagram ? (
                    <TouchableOpacity
                      style={[styles.socialPill, { backgroundColor: '#E1306C' }]}
                      onPress={() => {
                        const handle = social.instagram.replace('@', '');
                        Linking.openURL(`https://instagram.com/${handle}`).catch(() => {});
                      }}
                    >
                      <Text style={styles.socialPillText}>📷 Instagram</Text>
                    </TouchableOpacity>
                  ) : null}

                  {social.facebook ? (
                    <TouchableOpacity
                      style={[styles.socialPill, { backgroundColor: '#2563EB' }]}
                      onPress={() => {
                        const fb = social.facebook.includes('http')
                          ? social.facebook
                          : `https://facebook.com/${social.facebook}`;
                        Linking.openURL(fb).catch(() => {});
                      }}
                    >
                      <Text style={styles.socialPillText}>👤 Facebook</Text>
                    </TouchableOpacity>
                  ) : null}

                  {social.website ? (
                    <TouchableOpacity
                      style={[styles.socialPill, { backgroundColor: '#0F172A' }]}
                      onPress={() => {
                        const web = social.website.includes('http')
                          ? social.website
                          : `https://${social.website}`;
                        Linking.openURL(web).catch(() => {});
                      }}
                    >
                      <Text style={styles.socialPillText}>🔗 Website</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* Property Photos (if available and not privacy locked) */}
            {!isPrivacyLocked && profile.propertyPhotos && profile.propertyPhotos.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.cardHeaderTitle}>📸 {t.propertyPhotos}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                  {profile.propertyPhotos.map((photoUri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: photoUri }}
                      style={styles.propertyThumb}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={[styles.navigateBtn, isPrivacyLocked && styles.navigateBtnLocked]}
                activeOpacity={0.8}
                onPress={handleOpenMaps}
              >
                <Text style={styles.navigateBtnText}>
                  {isPrivacyLocked ? '🔒 Navigation Locked (Private)' : `🧭 ${t.openInMaps}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                activeOpacity={0.8}
                onPress={handleShare}
              >
                <Text style={styles.shareBtnText}>📤 {t.sharePin}</Text>
              </TouchableOpacity>
            </View>

            {/* Startup India Recognition Badge */}
            <View style={styles.startupBadgeWrap}>
              <Text style={styles.startupBadgeLabel}>Recognised by </Text>
              <Text style={styles.startupBadgeHash}>#</Text>
              <Image
                source={require('../../assets/startupindia.png')}
                style={styles.startupBadgeLogo}
                resizeMode="contain"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  checkIcon: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '900',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollArea: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 16,
  },
  topProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pinPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  pinText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  locationSummary: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: '35%',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    width: '65%',
    textAlign: 'right',
  },
  coordsValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    width: '65%',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  photosScroll: {
    marginTop: 8,
  },
  propertyThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 4,
  },
  navigateBtn: {
    backgroundColor: '#112240',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#112240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  navigateBtnLocked: {
    backgroundColor: '#64748B',
    opacity: 0.8,
  },
  privacyNoticeCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  privacyNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  privacyNoticeText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  socialPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  socialPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  pinBreakdownMiniRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  pinMiniChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pinMiniChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  startupBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 8,
  },
  startupBadgeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  startupBadgeHash: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F97316',
    marginRight: 2,
  },
  startupBadgeLogo: {
    height: 24,
    width: 95,
  },
});
