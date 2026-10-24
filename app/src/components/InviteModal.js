import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Clipboard,
  Alert,
  Platform,
} from 'react-native';

export default function InviteModal({ visible, onClose, pin }) {
  const inviteCode = (pin || 'WB-09-45896524').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const shareMessage = `Join OwnMyPin and claim your official doorstep DIGIPIN! Use my invite code: ${inviteCode} to get 3 months of free VIP: https://ownmypin.com/invite?code=${inviteCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'OwnMyPin Invite',
        message: shareMessage,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleCopy = () => {
    Clipboard.setString(inviteCode);
    Alert.alert('Code Copied', `Invite code ${inviteCode} copied to clipboard!`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Invite & Earn</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>🎁 REWARD: 3 MONTHS FREE VIP</Text>
          </View>

          <Text style={styles.desc}>
            Invite your neighbors and friends to register their digital doorstep PIN. When 3 friends verify their PIN, you get 3 months of VIP plan free!
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>YOUR UNIQUE INVITE CODE</Text>
            <Text style={styles.codeVal}>{inviteCode}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy Code</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.85} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share Invite Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  badgePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  desc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 1,
  },
  codeVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#112240',
    letterSpacing: 3,
    marginBottom: 12,
  },
  copyBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  copyBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  shareBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
});
