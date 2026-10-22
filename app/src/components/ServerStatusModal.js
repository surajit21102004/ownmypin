import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getApiBaseUrl, setApiBaseUrl, checkBackendHealth, LOCAL_PC_IP } from '../services/api';

export default function ServerStatusModal({ visible, onClose }) {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (visible) {
      setUrl(getApiBaseUrl());
      testUrl(getApiBaseUrl());
    }
  }, [visible]);

  const testUrl = async (testTarget) => {
    setIsTesting(true);
    setResult(null);
    setApiBaseUrl(testTarget);
    const res = await checkBackendHealth();
    setIsTesting(false);
    setResult(res);
  };

  const handleSave = () => {
    setApiBaseUrl(url);
    if (onClose) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>⚙️ Backend Server Settings</Text>
          <Text style={styles.subtitle}>
            Connect your phone to the Node.js backend running on your computer.
          </Text>

          <Text style={styles.label}>Server Base URL:</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder={`http://${LOCAL_PC_IP}:5000`}
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.quickButtonsRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => {
                const u = `http://${LOCAL_PC_IP}:5000`;
                setUrl(u);
                testUrl(u);
              }}
            >
              <Text style={styles.quickBtnText}>PC Wi-Fi IP ({LOCAL_PC_IP})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => {
                const u = 'http://localhost:5000';
                setUrl(u);
                testUrl(u);
              }}
            >
              <Text style={styles.quickBtnText}>Localhost</Text>
            </TouchableOpacity>
          </View>

          {/* Test Status Feedback */}
          <View style={styles.statusBox}>
            {isTesting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#152238" />
                <Text style={styles.statusText}>Pinging backend...</Text>
              </View>
            ) : result ? (
              <View>
                <Text
                  style={[
                    styles.statusText,
                    { color: result.ok ? '#059669' : '#DC2626', fontWeight: '700' },
                  ]}
                >
                  {result.ok
                    ? `✓ Connected (${result.latency}ms) - Node.js & MySQL Online`
                    : `✕ Cannot reach server (${result.error || 'Check PC Wi-Fi and Firewall'})`}
                </Text>
              </View>
            ) : (
              <Text style={styles.statusText}>Tap "Test Connection" below</Text>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => testUrl(url)}
              disabled={isTesting}
            >
              <Text style={styles.testBtnText}>Test Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#475569',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#152238',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
