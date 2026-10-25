import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';

const defaultNotifications = [
  {
    id: 'n1',
    title: 'Your registration was approved',
    time: '2 hours ago',
    desc: 'Doorstep PIN WB-09-45896524 is certified and active for digital navigation.',
  },
  {
    id: 'n2',
    title: 'Business verification update',
    time: 'Yesterday',
    desc: 'Your business profile has been received and is being verified by the OwnMyPin team.',
  },
  {
    id: 'n3',
    title: 'Invite and Earn reward',
    time: '3 days ago',
    desc: 'You earned 1 month of free VIP! Invite 2 more neighbors to get 3 months.',
  },
  {
    id: 'n4',
    title: 'New rating received',
    time: 'Oct 20',
    desc: 'You received a 5-star rating for verified doorstep location accuracy.',
  },
];

export default function NotificationsModal({
  visible,
  onClose,
  notifications = [],
  onClearAll,
}) {
  const displayItems =
    notifications && notifications.length > 0 ? notifications : defaultNotifications;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          {onClearAll && (
            <TouchableOpacity onPress={onClearAll}>
              <Text style={styles.clearAllText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {displayItems.map((item) => (
              <View key={item.id} style={styles.notifCard}>
                <View style={styles.orangeDot} />
                <View style={styles.notifTextCol}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifTime}>{item.time || 'Recent'}</Text>
                  {(item.desc || item.message) ? (
                    <Text style={styles.notifDesc}>{item.desc || item.message}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
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
  clearAllText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    marginTop: 6,
    marginRight: 14,
  },
  notifTextCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  notifDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
