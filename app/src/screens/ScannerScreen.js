import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Easing,
  Image,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';

export default function ScannerScreen({
  lang = 'en',
  onSwitchToSearch,
  onScanResult,
}) {
  const t = TRANSLATIONS[lang]?.scanner || TRANSLATIONS.en.scanner;
  const [isScanning, setIsScanning] = useState(false);
  const [customQrText, setCustomQrText] = useState('');

  // Scanning laser animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [laserAnim]);

  const samplePins = [
    { label: 'WB-09-45896524', name: 'Rahul Sharma (House)' },
    { label: 'WB-09-78677628', name: 'Surajit Mandal (Flat)' },
    { label: 'WB-09-54254718', name: 'Bengal Sweets (Shop)' },
  ];

  /**
   * Parse PIN from scanned string or URL (e.g. http://host:5000/location?pin=WB-09-45896524)
   */
  const extractPin = (raw) => {
    if (!raw) return 'WB-09-45896524';
    const str = raw.trim();
    const pinPattern = /([A-Za-z]{2}-\d{2}-\d{8})/i;
    const match = str.match(pinPattern);
    if (match) {
      return match[1].toUpperCase();
    }
    if (str.includes('pin=')) {
      try {
        const after = str.split('pin=')[1].split('&')[0];
        return decodeURIComponent(after).toUpperCase();
      } catch (e) {}
    }
    return str.toUpperCase();
  };

  const handleSimulateScan = (input) => {
    const cleanPin = extractPin(input);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onScanResult(cleanPin, true);
    }, 700);
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Subtitle */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      {/* Camera Viewfinder Box */}
      <View style={styles.scannerWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleSimulateScan('WB-09-45896524')}
          style={styles.viewfinderCard}
        >
          {/* Orange Rounded Target Box */}
          <View style={styles.targetFrame}>
            {/* Corner Bracket Accents */}
            <View style={[styles.cornerBracket, styles.bracketTL]} />
            <View style={[styles.cornerBracket, styles.bracketTR]} />
            <View style={[styles.cornerBracket, styles.bracketBL]} />
            <View style={[styles.cornerBracket, styles.bracketBR]} />

            {isScanning ? (
              <View style={styles.scanningAnimWrap}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.scanningAnimText}>Reading QR Code...</Text>
                <Text style={styles.scanningAnimSub}>Opening Doorstep Location & Unique PIN</Text>
              </View>
            ) : (
              <View style={styles.targetInner}>
                {/* Laser scan line */}
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserTranslateY }] },
                  ]}
                />
                <View style={styles.crosshairH} />
                <View style={styles.crosshairV} />
                <Text style={styles.viewfinderTapHint}>Tap to scan QR</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.instructionText}>{t.instruction}</Text>
      </View>

      {/* Button: "Enter PIN instead" */}
      <TouchableOpacity
        style={styles.enterPinBtn}
        activeOpacity={0.85}
        onPress={onSwitchToSearch}
      >
        <Text style={styles.enterPinBtnText}>{t.enterPinInstead}</Text>
      </TouchableOpacity>

      {/* Quick Test QR Code Buttons */}
      <View style={styles.quickTestSection}>
        <Text style={styles.quickTestLabel}>⚡ Tap to scan verified QR codes:</Text>
        <View style={styles.samplePinsRow}>
          {samplePins.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.samplePinPill}
              activeOpacity={0.7}
              onPress={() => handleSimulateScan(item.label)}
            >
              <Text style={styles.samplePinText}>📷 {item.label}</Text>
              <Text style={styles.samplePinName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom QR text or URL input */}
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="Paste QR Code URL or PIN..."
            placeholderTextColor="#94A3B8"
            value={customQrText}
            onChangeText={setCustomQrText}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.manualScanBtn}
            onPress={() => {
              if (customQrText.trim()) {
                handleSimulateScan(customQrText);
              }
            }}
          >
            <Text style={styles.manualScanBtnText}>Open</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Startup India Recognition Badge */}
      <View style={styles.startupFooter}>
        <Text style={styles.startupLabel}>Recognised by </Text>
        <Text style={styles.startupHash}>#</Text>
        <Image
          source={require('../../assets/startupindia.png')}
          style={styles.startupLogo}
          resizeMode="contain"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 36,
  },
  headerBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  scannerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  viewfinderCard: {
    width: '100%',
    aspectRatio: 1.05,
    backgroundColor: '#112240',
    borderRadius: 28,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#112240',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  targetFrame: {
    width: '90%',
    height: '90%',
    borderWidth: 2,
    borderColor: 'rgba(230, 138, 0, 0.5)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#F59E0B',
  },
  bracketTL: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  bracketTR: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bracketBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bracketBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  targetInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laserLine: {
    position: 'absolute',
    width: '80%',
    height: 2.5,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  crosshairH: {
    position: 'absolute',
    width: 32,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.35,
  },
  crosshairV: {
    position: 'absolute',
    height: 32,
    width: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.35,
  },
  viewfinderTapHint: {
    marginTop: 70,
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scanningAnimWrap: {
    alignItems: 'center',
    gap: 8,
  },
  scanningAnimText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
  },
  scanningAnimSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  enterPinBtn: {
    backgroundColor: '#112240',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#112240',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  enterPinBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  quickTestSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  quickTestLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  samplePinsRow: {
    gap: 8,
    marginBottom: 14,
  },
  samplePinPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  samplePinText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
    fontFamily: 'monospace',
  },
  samplePinName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0F172A',
  },
  manualScanBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualScanBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12,
  },
  startupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 8,
  },
  startupLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  startupHash: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F97316',
    marginRight: 2,
  },
  startupLogo: {
    height: 28,
    width: 110,
  },
});
