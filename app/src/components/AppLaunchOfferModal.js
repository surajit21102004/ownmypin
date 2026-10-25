import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function AppLaunchOfferModal({
  visible,
  popupData,
  onClose,
  onActionRedirect,
}) {
  if (!popupData || !popupData.enabled) return null;

  const handleAction = () => {
    onClose();
    if (popupData.action === 'external' && popupData.actionUrl) {
      Linking.openURL(popupData.actionUrl).catch(() => {});
    } else if (onActionRedirect) {
      onActionRedirect(popupData.action || 'refer');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close Icon */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Special Offer Banner Image */}
          {popupData.imageUrl ? (
            <Image
              source={{ uri: popupData.imageUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerFallback}>
              <Text style={styles.bannerFallbackIcon}>🎁</Text>
            </View>
          )}

          {/* Badge */}
          <View style={styles.specialBadge}>
            <Text style={styles.specialBadgeText}>🔥 SPECIAL OFFER</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{popupData.title || 'Special Offer!'}</Text>
          <Text style={styles.message}>
            {popupData.message || 'Check out our latest exclusive reward and doorstep benefits.'}
          </Text>

          {/* Primary Action Button (redirects to the selected area) */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleAction}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>
              {popupData.buttonText || 'Explore Now'}
            </Text>
          </TouchableOpacity>

          {/* Dismiss / Later */}
          <TouchableOpacity style={styles.skipBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  bannerImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    marginBottom: 14,
  },
  bannerFallback: {
    width: '100%',
    height: 130,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  bannerFallbackIcon: {
    fontSize: 48,
  },
  specialBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 10,
  },
  specialBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  actionBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  skipBtn: {
    paddingVertical: 6,
  },
  skipBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
