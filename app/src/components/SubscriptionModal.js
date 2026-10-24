import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';

export default function SubscriptionModal({
  visible,
  onClose,
  isVip,
  onUpgradeSuccess,
  onOpenInvite,
}) {
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => {
      setUpgrading(false);
      onUpgradeSuccess();
      Alert.alert(
        '🌟 VIP Activated!',
        'Congratulations! Your OwnMyPin account has been upgraded to VIP with Gold Verification.'
      );
      onClose();
    }, 700);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Subscription</Text>
            <Text style={styles.headerSubtitle}>Move from the Free plan to VIP.</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Free Plan Card */}
          <View style={styles.freeCard}>
            <Text style={styles.planName}>Free plan</Text>
            <Text style={styles.planSub}>{isVip ? 'Previous plan' : 'Your current plan'}</Text>
          </View>

          {/* VIP Plan Card (Matches Screenshot 2 Screen 2) */}
          <View style={[styles.vipCard, isVip && styles.vipCardActive]}>
            <View style={styles.vipHeaderRow}>
              <View>
                <Text style={styles.vipTitle}>VIP plan</Text>
                {isVip && (
                  <View style={styles.currentActiveBadge}>
                    <Text style={styles.currentActiveText}>✓ ACTIVE CURRENT PLAN</Text>
                  </View>
                )}
              </View>
              <Text style={styles.vipPrice}>₹199 / yr</Text>
            </View>

            <View style={styles.benefitsList}>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Verified Gold Business & Resident Badge</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Priority doorstep delivery routing & ads</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Custom VIP PIN (coming soon)</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Ad-free browsing and premium support</Text>
              </View>
            </View>
          </View>

          {/* Upgrade Button */}
          {!isVip ? (
            <TouchableOpacity
              style={styles.upgradeBtn}
              activeOpacity={0.85}
              onPress={handleUpgrade}
              disabled={upgrading}
            >
              <Text style={styles.upgradeBtnText}>
                {upgrading ? 'Processing...' : 'Upgrade to VIP'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.alreadyVipPill}>
              <Text style={styles.alreadyVipText}>🌟 You are an active VIP Member</Text>
            </View>
          )}

          {/* Footnote */}
          <TouchableOpacity
            style={styles.footnoteBtn}
            onPress={() => {
              onClose();
              if (onOpenInvite) onOpenInvite();
            }}
          >
            <Text style={styles.footnoteText}>
              Invite friends to earn 3 months of free VIP. 🎁
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  freeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  planSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  vipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginBottom: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  vipCardActive: {
    borderColor: '#10B981',
  },
  vipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  vipTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentActiveBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  currentActiveText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  vipPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  benefitsList: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 16,
    color: '#F59E0B',
    marginRight: 10,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  upgradeBtn: {
    backgroundColor: '#112240',
    borderRadius: 26,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#112240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  alreadyVipPill: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  alreadyVipText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '800',
  },
  footnoteBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  footnoteText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
