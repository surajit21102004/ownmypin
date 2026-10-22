import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import StatusCard from '../components/StatusCard';
import ProjectStructureCard from '../components/ProjectStructureCard';
import {
  checkBackendHealth,
  checkDatabaseHealth,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/api';
import { COLORS, SPACING } from '../constants/theme';

export default function HomeScreen() {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const [backendState, setBackendState] = useState({
    loading: false,
    connected: false,
    details: null,
    error: null,
  });

  const [dbState, setDbState] = useState({
    loading: false,
    connected: false,
    details: null,
    error: null,
  });

  const testAllConnections = useCallback(async () => {
    setBackendState((prev) => ({ ...prev, loading: true, error: null }));
    setDbState((prev) => ({ ...prev, loading: true, error: null }));

    // 1. Test Backend API
    const beRes = await checkBackendHealth();
    if (beRes.ok && beRes.data) {
      setBackendState({
        loading: false,
        connected: true,
        details: {
          Status: beRes.data.message || 'OK',
          Uptime: `${beRes.data.uptimeSeconds}s`,
          Latency: `${beRes.latency}ms`,
          Env: beRes.data.environment || 'development',
        },
        error: null,
      });
    } else {
      setBackendState({
        loading: false,
        connected: false,
        details: null,
        error: beRes.error || `HTTP ${beRes.status}`,
      });
    }

    // 2. Test MySQL Database via Backend
    const dbRes = await checkDatabaseHealth();
    if (dbRes.ok && dbRes.data && dbRes.data.success) {
      const details = dbRes.data.details || {};
      setDbState({
        loading: false,
        connected: true,
        details: {
          Host: details.host || 's1-nnvp.crazzydns.com',
          Database: details.database || 'ecompone_ownmypin',
          Version: details.version || 'MariaDB',
          Latency: `${dbRes.latency}ms`,
          Tables: `${details.tablesCount} tables`,
        },
        error: null,
      });
    } else {
      setDbState({
        loading: false,
        connected: false,
        details: null,
        error:
          (dbRes.data && dbRes.data.message) ||
          dbRes.error ||
          'Failed to reach database via backend',
      });
    }
  }, []);

  useEffect(() => {
    testAllConnections();
  }, [testAllConnections]);

  const handleApplyUrl = () => {
    setApiBaseUrl(apiUrl);
    setIsEditingUrl(false);
    testAllConnections();
  };

  const isAnyLoading = backendState.loading || dbState.loading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Header />

      {/* Backend URL Config Bar */}
      <View style={styles.urlCard}>
        <View style={styles.urlHeader}>
          <Text style={styles.urlLabel}>🌐 Backend API Endpoint</Text>
          <TouchableOpacity onPress={() => setIsEditingUrl(!isEditingUrl)}>
            <Text style={styles.urlEditBtn}>{isEditingUrl ? 'Cancel' : 'Change'}</Text>
          </TouchableOpacity>
        </View>

        {isEditingUrl ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://localhost:5000"
              placeholderTextColor={COLORS.textDark}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleApplyUrl}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.currentUrl}>{apiUrl}</Text>
        )}
      </View>

      {/* Status Cards */}
      <StatusCard
        title="Node.js & Express Server"
        icon="⚡"
        isConnected={backendState.connected}
        isLoading={backendState.loading}
        details={backendState.details}
        errorMessage={backendState.error}
      />

      <StatusCard
        title="MySQL Database (Remote)"
        icon="🐬"
        isConnected={dbState.connected}
        isLoading={dbState.loading}
        details={dbState.details}
        errorMessage={dbState.error}
      />

      {/* Re-test Action Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.testButton, isAnyLoading && styles.testButtonDisabled]}
          onPress={testAllConnections}
          disabled={isAnyLoading}
          activeOpacity={0.8}
        >
          {isAnyLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Text style={styles.testButtonIcon}>🔄</Text>
              <Text style={styles.testButtonText}>Test Connection</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Architecture Overview */}
      <ProjectStructureCard />

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ownMyPin • Ready for app development
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: SPACING.xxl,
  },
  urlCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  urlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  urlLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  urlEditBtn: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  currentUrl: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  actionSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonIcon: {
    fontSize: 16,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  footerText: {
    color: COLORS.textDark,
    fontSize: 12,
  },
});
