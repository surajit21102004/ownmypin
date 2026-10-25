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
import {
  VerifiedCheckIcon,
  CloseIcon,
  CameraIcon,
  StoreIcon,
  MapPinIcon,
  StarIcon,
  ZoomIcon,
  NavigationIcon,
  ShareIcon,
  ShieldLockIcon,
} from './SvgIcons';

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

  const [previewImage, setPreviewImage] = React.useState(null);

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
              <CloseIcon size={18} color="#64748B" />
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
                  <Image source={{ uri: profile.selfieUrl }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {(profile.fullName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.verifiedBadgeCircle}>
                  <VerifiedCheckIcon size={11} color="#FFFFFF" />
                </View>
                <View style={[styles.selfieTagPill, profile.isBusiness && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  {profile.isBusiness ? (
                    <StoreIcon size={12} color="#92400E" />
                  ) : (
                    <CameraIcon size={12} color="#475569" />
                  )}
                  <Text style={[styles.selfieTagText, profile.isBusiness && { color: '#92400E' }]}>
                    {profile.isBusiness ? 'Shop Logo' : 'Applicant Selfie'}
                  </Text>
                </View>
              </View>

              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{profile.fullName}</Text>
                <View style={styles.pinPill}>
                  <Text style={styles.pinText}>{profile.pin}</Text>
                </View>

                {/* Categorised Property Badges */}
                <View style={styles.categoryBadgeRow}>
                  {profile.isBusiness ? (
                    <>
                      <View style={[styles.catBadgeItem, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                        <Text style={[styles.catBadgeText, { color: '#92400E' }]}>🏪 Business</Text>
                      </View>
                      <View style={[styles.catBadgeItem, { backgroundColor: '#CCFBF1', borderColor: '#99F6E4' }]}>
                        <Text style={[styles.catBadgeText, { color: '#0F766E' }]}>🏷️ {profile.propertyType || 'Commercial'}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.catBadgeItem}>
                        <Text style={styles.catBadgeText}>
                          {profile.propertyType === 'Flat' ? '🏢 Flat' : profile.propertyType === 'Shop' ? '🏪 Shop' : '🏠 House'}
                        </Text>
                      </View>
                      <View style={[styles.catBadgeItem, styles.catBadgeOwn]}>
                        <Text style={[styles.catBadgeText, styles.catBadgeOwnText]}>
                          {profile.ownershipType === 'Rent' ? '📋 Rented' : '🔑 Self-Owned'}
                        </Text>
                      </View>
                    </>
                  )}
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
                <View style={styles.locRow}>
                  <MapPinIcon size={13} color="#64748B" />
                  <Text style={styles.locationSummary}>{profile.location}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <StarIcon size={13} color="#D97706" />
                  <Text style={styles.ratingText}>{profile.rating || '4.8'} (Official Verification)</Text>
                </View>
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

            {/* Property Photos (Given Doorstep & Exterior Images) */}
            {!isPrivacyLocked && profile.propertyPhotos && profile.propertyPhotos.length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.photoHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>📸 Given Doorstep Images</Text>
                  <View style={styles.photoCountBadge}>
                    <Text style={styles.photoCountText}>{profile.propertyPhotos.length} Photos</Text>
                  </View>
                </View>
                <Text style={styles.photoSubHint}>Tap any photo to view full doorstep image:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                  {profile.propertyPhotos.map((photoUri, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.88}
                      onPress={() => setPreviewImage(photoUri)}
                      style={styles.photoCardWrap}
                    >
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.propertyThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.photoZoomOverlay}>
                        <ZoomIcon size={13} color="#FFFFFF" />
                        <Text style={styles.zoomIconText}>Zoom</Text>
                      </View>
                    </TouchableOpacity>
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
                {isPrivacyLocked ? (
                  <ShieldLockIcon size={16} color="#FFFFFF" />
                ) : (
                  <NavigationIcon size={15} color="#FFFFFF" />
                )}
                <Text style={styles.navigateBtnText}>
                  {isPrivacyLocked ? 'Navigation Locked (Private)' : t.openInMaps}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                activeOpacity={0.8}
                onPress={handleShare}
              >
                <ShareIcon size={15} color="#0F172A" />
                <Text style={styles.shareBtnText}>{t.sharePin}</Text>
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

      {/* Fullscreen Photo Zoom Modal */}
      {previewImage && (
        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View style={styles.fullscreenModalOverlay}>
            <TouchableOpacity
              style={styles.fullscreenCloseBtn}
              onPress={() => setPreviewImage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.fullscreenCloseText}>✕ Close</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
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
    alignItems: 'center',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#0284C7',
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieTagPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  selfieTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  catBadgeItem: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  catBadgeOwn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  catBadgeOwnText: {
    color: '#1D4ED8',
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    top: 48,
    right: 2,
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
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  photoCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  photoCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  photoSubHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  photosScroll: {
    marginTop: 4,
  },
  photoCardWrap: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  propertyThumb: {
    width: 140,
    height: 105,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  photoZoomOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zoomIconText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  fullscreenCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 4,
  },
  navigateBtn: {
    flexDirection: 'row',
    gap: 8,
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
    flexDirection: 'row',
    gap: 8,
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
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
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
