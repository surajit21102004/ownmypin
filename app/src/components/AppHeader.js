import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TRANSLATIONS } from '../constants/translations';
import { GlobeIcon, BellIcon } from './SvgIcons';

export default function AppHeader({
  lang = 'en',
  onToggleLang,
  unreadCount = 0,
  onOpenNotifications,
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const getLangLabel = () => {
    if (lang === 'bn') return 'বাংলা';
    if (lang === 'hi') return 'हिन्दी';
    return 'EN';
  };

  return (
    <View style={styles.headerContainer}>
      {/* Brand Logo */}
      <View style={styles.logoRow}>
        <Image
          source={require('../../assets/ownmypin.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
      </View>

      {/* Right Header Actions: Language Switcher & Notification Bell */}
      <View style={styles.actionsRow}>
        {/* Language Switcher Pill with SVG Globe */}
        <TouchableOpacity
          style={styles.langPill}
          activeOpacity={0.75}
          onPress={onToggleLang}
        >
          <GlobeIcon size={15} color="#475569" />
          <Text style={styles.langText}>{getLangLabel()}</Text>
        </TouchableOpacity>

        {/* Notification Bell with SVG Bell */}
        <TouchableOpacity
          style={styles.bellButton}
          activeOpacity={0.75}
          onPress={onOpenNotifications}
        >
          <BellIcon size={20} color="#0F172A" />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 130,
    height: 38,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
