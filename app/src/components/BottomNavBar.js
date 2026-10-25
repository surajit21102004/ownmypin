import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { TRANSLATIONS } from '../constants/translations';
import {
  HomeIcon,
  SearchIcon,
  ScannerIcon,
  DscIcon,
  AccountIcon,
} from './SvgIcons';

export default function BottomNavBar({ activeTab, onSelectTab, lang = 'en' }) {
  const t = TRANSLATIONS[lang]?.tabs || TRANSLATIONS.en.tabs;

  const tabs = [
    { id: 'home', label: t.home, IconComponent: HomeIcon },
    { id: 'search', label: t.search, IconComponent: SearchIcon },
    { id: 'scanner', label: t.scanner, IconComponent: ScannerIcon, isCenter: true },
    { id: 'dsc', label: t.dsc, IconComponent: DscIcon },
    { id: 'account', label: t.account, IconComponent: AccountIcon },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.IconComponent;

        // Elevated center Scanner button for quick access
        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.centerTabButton}
              activeOpacity={0.85}
              onPress={() => onSelectTab(tab.id)}
            >
              <View style={[styles.centerIconCircle, isActive && styles.centerIconCircleActive]}>
                <Icon size={24} color="#FFFFFF" focused={isActive} />
              </View>
              <Text style={[styles.centerTabLabel, isActive && styles.centerTabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            activeOpacity={0.75}
            onPress={() => onSelectTab(tab.id)}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon size={21} color={isActive ? '#0F172A' : '#94A3B8'} focused={isActive} />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
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
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
    position: 'relative',
  },
  iconWrap: {
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderRadius: 15,
  },
  iconWrapActive: {
    backgroundColor: '#F1F5F9',
  },
  tabLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F172A',
    marginTop: 2,
  },

  // Elevated Center Tab (Scanner)
  centerTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.1,
    marginTop: -16,
  },
  centerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 2,
  },
  centerIconCircleActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
  },
  centerTabLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  centerTabLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
});
