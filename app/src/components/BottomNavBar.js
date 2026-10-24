import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';

export default function BottomNavBar({ activeTab, onSelectTab, lang = 'en' }) {
  const t = TRANSLATIONS[lang]?.tabs || TRANSLATIONS.en.tabs;

  const tabs = [
    { id: 'home', label: t.home, icon: '🏠' },
    { id: 'search', label: t.search, icon: '🔍' },
    { id: 'scanner', label: t.scanner, icon: '⛶' },
    { id: 'dsc', label: t.dsc, icon: '🛡️' },
    { id: 'account', label: t.account, icon: '👤' },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.id)}
          >
            {isActive ? (
              <View style={styles.activeIconPill}>
                <Text style={styles.activeIcon}>{tab.icon}</Text>
              </View>
            ) : (
              <View style={styles.inactiveIconWrap}>
                <Text style={styles.inactiveIcon}>{tab.icon}</Text>
              </View>
            )}
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  activeIconPill: {
    backgroundColor: '#E68A00',
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  inactiveIconWrap: {
    width: 48,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inactiveIcon: {
    fontSize: 18,
    opacity: 0.65,
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
});
