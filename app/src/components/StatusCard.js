import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function StatusCard({ title, icon, isConnected, isLoading, details, errorMessage }) {
  const getStatusColor = () => {
    if (isLoading) return COLORS.warning;
    if (isConnected) return COLORS.success;
    return COLORS.error;
  };

  const getStatusBadge = () => {
    if (isLoading) return 'Testing...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isConnected
                ? COLORS.successBg
                : isLoading
                ? COLORS.warningBg
                : COLORS.errorBg,
              borderColor: getStatusColor(),
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.badgeText, { color: getStatusColor() }]}>
            {getStatusBadge()}
          </Text>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {details && (
        <View style={styles.detailsContainer}>
          {Object.entries(details).map(([key, value]) => (
            <View key={key} style={styles.detailRow}>
              <Text style={styles.detailKey}>{key}:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.errorBg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
  },
  detailsContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '65%',
  },
});
