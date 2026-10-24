import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getNearbyBusinesses } from '../services/api';

const defaultBusinesses = [
  {
    id: 1,
    name: 'Super Mart Rishra',
    category: 'Grocery & Essentials',
    distance: '0.4 km',
    rating: 4.8,
    latitude: 22.7135,
    longitude: 88.3531,
  },
  {
    id: 2,
    name: 'City Medico & Diagnostic',
    category: 'Healthcare & 24x7 Pharmacy',
    distance: '0.9 km',
    rating: 4.9,
    latitude: 22.7118,
    longitude: 88.3512,
  },
  {
    id: 3,
    name: 'Aroma Cafe & Bakery',
    category: 'Food & Dining',
    distance: '1.3 km',
    rating: 4.7,
    latitude: 22.7142,
    longitude: 88.3548,
  },
  {
    id: 4,
    name: 'QuickFix Electronics',
    category: 'Mobile & Appliance Repair',
    distance: '1.8 km',
    rating: 4.6,
    latitude: 22.7105,
    longitude: 88.3495,
  },
];

const getMultiPinMapHtml = (businesses) => {
  const centerLat = businesses[0]?.latitude || 22.7126;
  const centerLng = businesses[0]?.longitude || 88.3524;
  const markersJs = businesses
    .map(
      (b) => `
    L.marker([${b.latitude}, ${b.longitude}]).addTo(map)
      .bindPopup('<b>${b.name}</b><br>${b.category} · ${b.distance}');
  `
    )
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; background: #e2e8f0; }
    .leaflet-control-attribution { font-size: 8px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    ${markersJs}
  </script>
</body>
</html>
`;
};

export default function NearbyBusinessesModal({ visible, onClose }) {
  const [businesses, setBusinesses] = useState(defaultBusinesses);

  useEffect(() => {
    if (visible) {
      loadBusinesses();
    }
  }, [visible]);

  const loadBusinesses = async () => {
    try {
      const res = await getNearbyBusinesses();
      if (res && res.success && res.businesses && res.businesses.length > 0) {
        setBusinesses(res.businesses);
      }
    } catch (e) {
      // keep fallback
    }
  };

  const handleNavigate = (biz) => {
    const lat = biz.latitude || 22.7126;
    const lng = biz.longitude || 88.3524;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(biz.name)})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation', `Opening Google Maps to ${biz.name} (${lat}, ${lng})`);
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Nearby businesses</Text>
            <Text style={styles.headerSubtitle}>Verified businesses around you.</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Map Preview Box (matches Screenshot 2 Screen 1) */}
          <View style={styles.mapBox}>
            <WebView
              originWhitelist={['*']}
              source={{ html: getMultiPinMapHtml(businesses) }}
              style={styles.webview}
              scrollEnabled={false}
            />
            <View style={styles.mapOverlayPill}>
              <Text style={styles.mapOverlayText}>📍 OpenStreetMap Verified Area</Text>
            </View>
          </View>

          {/* Business Cards List */}
          <View style={styles.listSection}>
            {businesses.map((biz) => (
              <View key={biz.id} style={styles.bizCard}>
                <View style={styles.bizMeta}>
                  <View style={styles.bizNameRow}>
                    <Text style={styles.bizName}>{biz.name}</Text>
                    <View style={styles.greenCheck}>
                      <Text style={styles.greenCheckText}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.bizSub}>
                    {biz.category} · {biz.distance || '0.5 km'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.navigateBtn}
                  activeOpacity={0.85}
                  onPress={() => handleNavigate(biz)}
                >
                  <Text style={styles.navigateBtnText}>Navigate</Text>
                </TouchableOpacity>
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
  mapBox: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: '100%',
  },
  mapOverlayPill: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listSection: {
    gap: 12,
  },
  bizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bizMeta: {
    flex: 1,
    marginRight: 12,
  },
  bizNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bizName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  greenCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenCheckText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  bizSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  navigateBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  navigateBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
});
