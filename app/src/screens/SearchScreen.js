import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';
import { searchPin } from '../services/api';

export default function SearchScreen({
  lang = 'en',
  onViewProfile,
  initialQuery = '',
}) {
  const t = TRANSLATIONS[lang]?.search || TRANSLATIONS.en.search;

  const [query, setQuery] = useState(initialQuery || 'WB-09-45896524');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [recentSearches, setRecentSearches] = useState([
    'WB-09-45896524',
    'WB-09-62641760',
    'WB-09-78677628',
  ]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    } else {
      setResult(null);
    }
  }, [initialQuery]);

  const performSearch = async (searchTerm) => {
    const term = (searchTerm || query).trim();
    if (!term) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await searchPin(term);
      if (res && res.success && res.profile) {
        setResult(res.profile);
        // Add to recents if not already there
        setRecentSearches((prev) => {
          const filtered = prev.filter((item) => item !== res.profile.pin);
          return [res.profile.pin, ...filtered].slice(0, 5);
        });
      } else {
        setResult(null);
        setErrorMsg(res.message || t.notFound);
      }
    } catch (err) {
      setResult(null);
      setErrorMsg(t.notFound);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (profile) => {
    if (!profile) return;
    if (profile.privacy_mode) {
      Alert.alert(
        '🔒 Privacy Protected',
        'This resident has enabled Privacy Mode. Exact doorstep coordinates and navigation are locked. Direct verified link or QR scan from the owner is required.'
      );
      return;
    }
    const lat = profile.latitude || 22.7126;
    const lng = profile.longitude || 88.3524;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Map Navigation', `Coordinates: ${lat}, ${lng}`);
    });
  };

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

      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t.placeholder}
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => performSearch(query)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Button */}
      <TouchableOpacity
        style={styles.searchBtn}
        activeOpacity={0.85}
        onPress={() => performSearch(query)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.searchBtnText}>{t.button}</Text>
        )}
      </TouchableOpacity>

      {/* Error / Not Found Message */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        </View>
      )}

      {/* Result Section */}
      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionHeading}>{t.result}</Text>

          <View style={styles.resultCard}>
            {/* Top row: Avatar + Name + Check + PIN badge */}
            <View style={styles.resultTopRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {(result.fullName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.resultInfoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.resultFullName}>{result.fullName}</Text>
                  <View style={styles.greenCheckBadge}>
                    <Text style={styles.badgeCheckIcon}>✓</Text>
                  </View>
                </View>

                <View style={styles.pinTagPill}>
                  <Text style={styles.pinTagText}>{result.pin}</Text>
                </View>
              </View>
            </View>

            {/* Privacy Mode Banner (if enabled) */}
            {result.privacy_mode && (
              <View style={styles.privacyShieldBadge}>
                <Text style={styles.privacyShieldText}>
                  🔒 Privacy Mode Active: Coordinates protected
                </Text>
              </View>
            )}

            {/* Location & Rating row */}
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>
                {result.privacy_mode ? `${result.city || 'Area'}, ${result.district || 'District'}` : result.location}
              </Text>
              <Text style={styles.ratingText}>★ {result.rating || '4.8'}</Text>
            </View>

            {/* Linked Social Media Profiles */}
            {result.social_profiles && (
              <View style={styles.socialMiniRow}>
                {result.social_profiles.whatsapp ? (
                  <TouchableOpacity
                    style={[styles.socialMiniBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => {
                      const cleanPhone = result.social_profiles.whatsapp.replace(/[^0-9]/g, '');
                      Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {});
                    }}
                  >
                    <Text style={styles.socialMiniBtnText}>💬 WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}

                {result.social_profiles.instagram ? (
                  <TouchableOpacity
                    style={[styles.socialMiniBtn, { backgroundColor: '#E1306C' }]}
                    onPress={() => {
                      const handle = result.social_profiles.instagram.replace('@', '');
                      Linking.openURL(`https://instagram.com/${handle}`).catch(() => {});
                    }}
                  >
                    <Text style={styles.socialMiniBtnText}>📷 Instagram</Text>
                  </TouchableOpacity>
                ) : null}

                {result.social_profiles.facebook ? (
                  <TouchableOpacity
                    style={[styles.socialMiniBtn, { backgroundColor: '#2563EB' }]}
                    onPress={() => {
                      const fb = result.social_profiles.facebook.includes('http')
                        ? result.social_profiles.facebook
                        : `https://facebook.com/${result.social_profiles.facebook}`;
                      Linking.openURL(fb).catch(() => {});
                    }}
                  >
                    <Text style={styles.socialMiniBtnText}>👤 Facebook</Text>
                  </TouchableOpacity>
                ) : null}

                {result.social_profiles.website ? (
                  <TouchableOpacity
                    style={[styles.socialMiniBtn, { backgroundColor: '#0F172A' }]}
                    onPress={() => {
                      const web = result.social_profiles.website.includes('http')
                        ? result.social_profiles.website
                        : `https://${result.social_profiles.website}`;
                      Linking.openURL(web).catch(() => {});
                    }}
                  >
                    <Text style={styles.socialMiniBtnText}>🔗 Website</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Action Buttons: View Profile & Navigate */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.viewProfileBtn}
                activeOpacity={0.8}
                onPress={() => onViewProfile(result)}
              >
                <Text style={styles.viewProfileText}>{t.viewProfile}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navigateBtn, result.privacy_mode && { backgroundColor: '#64748B' }]}
                activeOpacity={0.8}
                onPress={() => handleNavigate(result)}
              >
                <Text style={styles.navigateBtnText}>
                  {result.privacy_mode ? '🔒 Locked' : t.navigate}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Recent Searches Section */}
      <View style={styles.recentsSection}>
        <Text style={styles.recentsHeading}>{t.recentSearches}</Text>

        <View style={styles.recentsList}>
          {recentSearches.map((pinItem, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.recentItemRow}
              activeOpacity={0.7}
              onPress={() => {
                setQuery(pinItem);
                performSearch(pinItem);
              }}
            >
              <Text style={styles.recentPinText}>{pinItem}</Text>
              <Text style={styles.recentChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    fontFamily: 'monospace',
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  searchBtn: {
    backgroundColor: '#112240',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#112240',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  // Result
  resultSection: {
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563EB',
  },
  resultInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  resultFullName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  greenCheckBadge: {
    backgroundColor: '#10B981',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCheckIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  pinTagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pinTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'monospace',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  ratingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  privacyShieldBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  privacyShieldText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  socialMiniRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  socialMiniBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  socialMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  viewProfileBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  navigateBtn: {
    flex: 1,
    backgroundColor: '#112240',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Recents
  recentsSection: {},
  recentsHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  recentsList: {
    gap: 8,
  },
  recentItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  recentPinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  recentChevron: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
