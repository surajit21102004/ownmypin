import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Image,
  Linking,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';
import { getPinQrCodeUrl, getPinLocationUrl } from '../services/api';

export default function QrCodeModal({
  visible,
  onClose,
  pin = 'WB-09-45896524',
  name = 'Rahul Sharma',
  lang = 'en',
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const parts = pin.split('-');
  const stateCode = parts[0] || 'WB';
  const districtCode = parts[1] || '09';
  const uniqueCode = parts[2] || '45896524';

  const locationUrl = getPinLocationUrl(pin);
  const primaryQrUrl = getPinQrCodeUrl(pin);
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(locationUrl)}`;

  const [qrImgSrc, setQrImgSrc] = useState({ uri: primaryQrUrl });

  useEffect(() => {
    setQrImgSrc({ uri: getPinQrCodeUrl(pin) });
  }, [pin]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My verified OwnMyPin DIGIPIN is: ${pin}\nName: ${name}\nOpen Doorstep Location & Map: ${locationUrl}`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleOpenLocation = () => {
    Linking.openURL(locationUrl).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>DIGIPIN Doorstep QR</Text>
              <View style={styles.verifiedMiniTag}>
                <Text style={styles.verifiedMiniText}>✓ Verified</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Name & PIN */}
          <Text style={styles.nameText}>{name}</Text>
          <View style={styles.pinBadge}>
            <Text style={styles.pinCodeText}>{pin}</Text>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>

          {/* Real Scannable High-Definition QR Code Card */}
          <View style={styles.qrWrapper}>
            <View style={styles.qrBorderFrame}>
              <Image
                source={qrImgSrc}
                style={styles.realQrImage}
                resizeMode="contain"
                onError={() => {
                  setQrImgSrc({ uri: fallbackQrUrl });
                }}
              />
            </View>
            <Text style={styles.qrScanCaption}>
              Scan with any camera to open doorstep location & show unique PIN
            </Text>
          </View>

          {/* Breakdown tags */}
          <View style={styles.breakdownRow}>
            <View style={styles.pillTag}>
              <Text style={styles.pillText}>{stateCode} · State</Text>
            </View>
            <View style={styles.pillTag}>
              <Text style={styles.pillText}>{districtCode} · District</Text>
            </View>
            <View style={styles.pillTag}>
              <Text style={styles.pillText}>{uniqueCode} · Unique</Text>
            </View>
          </View>

          {/* Action buttons row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.openLocationBtn}
              activeOpacity={0.85}
              onPress={handleOpenLocation}
            >
              <Text style={styles.openLocationText}>🧭 Open Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.85}
              onPress={handleShare}
            >
              <Text style={styles.shareBtnText}>📤 {t.shareQr || 'Share'}</Text>
            </TouchableOpacity>
          </View>

          {/* Startup India Recognition Badge */}
          <View style={styles.startupBadgeRow}>
            <Text style={styles.startupLabel}>Recognised by </Text>
            <Text style={styles.startupHash}>#</Text>
            <Image
              source={require('../../assets/startupindia.png')}
              style={styles.startupLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedMiniTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedMiniText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
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
  nameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
    gap: 6,
  },
  pinCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  checkCircle: {
    backgroundColor: '#10B981',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  qrWrapper: {
    alignItems: 'center',
    marginBottom: 14,
  },
  qrBorderFrame: {
    width: 195,
    height: 195,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 18,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  realQrImage: {
    width: '100%',
    height: '100%',
  },
  qrScanCaption: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  pillTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 14,
  },
  openLocationBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openLocationText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#112240',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  startupBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  startupLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  startupHash: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F97316',
    marginRight: 2,
  },
  startupLogo: {
    height: 24,
    width: 95,
  },
});
