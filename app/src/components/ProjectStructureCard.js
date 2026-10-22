import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function ProjectStructureCard() {
  const structure = [
    {
      folder: 'app/',
      label: 'Expo & React Native (JS)',
      items: ['src/services/api.js', 'src/screens/', 'src/components/', 'App.js'],
    },
    {
      folder: 'be/',
      label: 'Express & MySQL Backend',
      items: ['src/config/db.js', 'src/routes/', 'src/server.js', '.env'],
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📂 Project Architecture</Text>
      <Text style={styles.subtitle}>
        Separated Frontend and Backend structure
      </Text>

      <View style={styles.structureContainer}>
        {structure.map((item, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.folderName}>{item.folder}</Text>
              <Text style={styles.folderDesc}>• {item.label}</Text>
            </View>
            <View style={styles.itemsList}>
              {item.items.map((sub, i) => (
                <Text key={i} style={styles.subItem}>
                  ├─ {sub}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  structureContainer: {
    gap: SPACING.md,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  folderName: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  folderDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  itemsList: {
    paddingLeft: 8,
  },
  subItem: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
