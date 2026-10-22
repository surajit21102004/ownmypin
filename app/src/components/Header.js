import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>📌</Text>
        </View>
        <View style={styles.versionTag}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
      <Text style={styles.title}>ownMyPin</Text>
      <Text style={styles.subtitle}>
        Expo & React Native • Node.js Express • MySQL Database
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
  },
  versionTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.4)',
  },
  versionText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
});
