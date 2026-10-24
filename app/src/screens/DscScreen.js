import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';
import { getDailyNews, getNearbyBusinesses } from '../services/api';

export default function DscScreen({ lang = 'en' }) {
  const t = TRANSLATIONS[lang]?.dsc || TRANSLATIONS.en.dsc;

  // Active sub-tab: 'news' | 'searches'
  const [activeTab, setActiveTab] = useState('news');
  const [newsList, setNewsList] = useState([]);
  const [nearbyBiz, setNearbyBiz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    loadDscData();
  }, []);

  const loadDscData = async () => {
    try {
      setLoading(true);
      const [newsRes, bizRes] = await Promise.all([
        getDailyNews(),
        getNearbyBusinesses(),
      ]);

      if (newsRes && newsRes.success && newsRes.news) {
        setNewsList(newsRes.news);
      }
      if (bizRes && bizRes.success && bizRes.businesses) {
        setNearbyBiz(bizRes.businesses);
      }
    } catch (e) {
      console.warn('Error loading DSC data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToBiz = (biz) => {
    const lat = biz.latitude || 22.7126;
    const lng = biz.longitude || 88.3524;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const formatDate = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(
      lang === 'bn' ? 'bn-IN' : lang === 'hi' ? 'hi-IN' : 'en-US',
      options
    );
  };

  const featured = newsList[0] || {
    headline: 'West Bengal Launches Unified Digital Pin Portal with OwnMyPin',
    summary: 'Citizens can now register properties for tamper-proof digital addresses.',
    content: 'Full story on state-wide GPS doorstep routing and verification rollout.',
    image_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=60',
    time_ago: '2h ago',
  };

  const remainingNews = newsList.slice(1);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      {/* Segmented Control: [Daily News] | [Daily Searches] */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'news' && styles.segmentBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('news')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'news' && styles.segmentTextActive,
            ]}
          >
            {t.dailyNewsTab}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'searches' && styles.segmentBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('searches')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'searches' && styles.segmentTextActive,
            ]}
          >
            {t.dailySearchesTab}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* TAB 1: DAILY NEWS (Screenshot 4) */}
        {/* ======================================================== */}
        {activeTab === 'news' && (
          <View>
            {/* Today's Date */}
            <Text style={styles.dateLabel}>{formatDate()}</Text>

            {/* Featured News Card */}
            <TouchableOpacity
              style={styles.featuredCard}
              activeOpacity={0.9}
              onPress={() => setSelectedArticle(featured)}
            >
              <View style={styles.featuredImgWrap}>
                {featured.image_url ? (
                  <Image
                    source={{ uri: featured.image_url }}
                    style={styles.featuredImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImg}>
                    <Text style={styles.placeholderText}>Official Announcement</Text>
                  </View>
                )}
              </View>

              <View style={styles.featuredContentCol}>
                <Text style={styles.featuredHeadline}>{featured.headline}</Text>
                <Text style={styles.featuredSummary}>
                  {featured.summary} · {featured.time_ago || '2h ago'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Remaining News List */}
            <View style={styles.newsListCol}>
              {(remainingNews.length > 0 ? remainingNews : [
                {
                  id: 99,
                  headline: 'Emergency Services Adopt DIGIPIN for Faster 10-Minute Response',
                  time_ago: '4h ago',
                  image_url: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=800&auto=format&fit=crop&q=60',
                },
                {
                  id: 100,
                  headline: 'Local Commercial Hubs in Hooghly District Go Fully Digital',
                  time_ago: '1d ago',
                  image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60',
                },
              ]).map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.newsItemCard}
                  activeOpacity={0.8}
                  onPress={() => setSelectedArticle(item)}
                >
                  <View style={styles.newsItemThumbWrap}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.newsItemThumb} />
                    ) : (
                      <View style={styles.newsItemPlaceholder} />
                    )}
                  </View>
                  <View style={styles.newsItemInfoCol}>
                    <Text style={styles.newsItemHeadline} numberOfLines={2}>
                      {item.headline}
                    </Text>
                    <Text style={styles.newsItemTime}>{item.time_ago || 'Recent'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DAILY SEARCHES / NEARBY BUSINESSES (Screenshot 5) */}
        {/* ======================================================== */}
        {activeTab === 'searches' && (
          <View>
            <Text style={styles.bizTitle}>{t.nearbyBusinesses}</Text>
            <Text style={styles.bizSubtitle}>{t.nearbySubtitle}</Text>

            {/* Google Map Preview Box matching Screenshot 5 */}
            <View style={styles.mapPreviewCard}>
              <View style={styles.mapInnerDecor}>
                <View style={styles.mapPin1}>
                  <Text style={styles.mapPinEmoji}>📍</Text>
                </View>
                <View style={styles.mapPin2}>
                  <Text style={styles.mapPinEmoji}>📍</Text>
                </View>
                <View style={styles.mapPin3}>
                  <Text style={styles.mapPinEmoji}>📍</Text>
                </View>
                <Text style={styles.mapLabel}>Google Maps Verified Area</Text>
              </View>
            </View>

            {/* Nearby Verified Businesses List */}
            <View style={styles.bizListCol}>
              {(nearbyBiz.length > 0 ? nearbyBiz : [
                {
                  name: 'Roy Medical & Diagnostics',
                  category: 'Pharmacy & Health',
                  distance: '0.4 km away',
                  latitude: 22.7126,
                  longitude: 88.3524,
                },
                {
                  name: 'Annapurna Grocery & Daily Needs',
                  category: 'Supermarket',
                  distance: '0.9 km away',
                  latitude: 22.7150,
                  longitude: 88.3560,
                },
                {
                  name: 'Bengal Sweets & Bakery',
                  category: 'Confectionery',
                  distance: '1.3 km away',
                  latitude: 22.7102,
                  longitude: 88.3490,
                },
              ]).map((biz, idx) => (
                <View key={idx} style={styles.bizCard}>
                  <View style={styles.bizInfoCol}>
                    <View style={styles.bizNameRow}>
                      <Text style={styles.bizName}>{biz.name}</Text>
                      <View style={styles.bizCheckCircle}>
                        <Text style={styles.bizCheckIcon}>✓</Text>
                      </View>
                    </View>
                    <Text style={styles.bizMeta}>
                      {biz.category} · {biz.distance}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bizNavigateBtn}
                    activeOpacity={0.85}
                    onPress={() => handleNavigateToBiz(biz)}
                  >
                    <Text style={styles.bizNavigateText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Full Article Modal */}
      {selectedArticle && (
        <Modal
          visible={!!selectedArticle}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedArticle(null)}
        >
          <View style={styles.articleModalOverlay}>
            <View style={styles.articleModalCard}>
              <View style={styles.articleModalHeader}>
                <Text style={styles.articleCategory}>{selectedArticle.category || 'News'}</Text>
                <TouchableOpacity onPress={() => setSelectedArticle(null)}>
                  <Text style={styles.articleCloseBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.articleScroll} showsVerticalScrollIndicator={false}>
                {selectedArticle.image_url && (
                  <Image
                    source={{ uri: selectedArticle.image_url }}
                    style={styles.articleModalImg}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.articleModalTitle}>{selectedArticle.headline}</Text>
                <Text style={styles.articleModalTime}>{selectedArticle.time_ago || 'Recent'}</Text>
                <Text style={styles.articleModalBody}>
                  {selectedArticle.content || selectedArticle.summary}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
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
  // Segmented control tabs
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#E68A00',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },
  // Featured news card (Screenshot 4)
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredImgWrap: {
    width: '100%',
    height: 150,
    backgroundColor: '#E0E7FF',
  },
  featuredImg: {
    width: '100%',
    height: 150,
  },
  placeholderImg: {
    width: '100%',
    height: 150,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  featuredContentCol: {
    padding: 16,
  },
  featuredHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 20,
  },
  featuredSummary: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  // News items list
  newsListCol: {
    gap: 12,
  },
  newsItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  newsItemThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#DBEAFE',
    flexShrink: 0,
  },
  newsItemThumb: {
    width: 60,
    height: 60,
  },
  newsItemPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#DBEAFE',
  },
  newsItemInfoCol: {
    flex: 1,
  },
  newsItemHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 18,
  },
  newsItemTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // TAB 2: Nearby Businesses (Screenshot 5)
  bizTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  bizSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  mapPreviewCard: {
    width: '100%',
    height: 170,
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapInnerDecor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPin1: {
    position: 'absolute',
    top: 30,
    left: 45,
  },
  mapPin2: {
    position: 'absolute',
    bottom: 40,
    right: 50,
  },
  mapPin3: {
    position: 'absolute',
    top: 60,
    right: 90,
  },
  mapPinEmoji: {
    fontSize: 22,
  },
  mapLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  bizListCol: {
    gap: 12,
  },
  bizCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bizInfoCol: {
    flex: 1,
  },
  bizNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bizName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bizCheckCircle: {
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizCheckIcon: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  bizMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  bizNavigateBtn: {
    backgroundColor: '#E68A00',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#E68A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bizNavigateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Full article modal
  articleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  articleModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  articleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  articleCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E68A00',
    textTransform: 'uppercase',
  },
  articleCloseBtn: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    padding: 4,
  },
  articleScroll: {
    marginBottom: 16,
  },
  articleModalImg: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 14,
  },
  articleModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  articleModalTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  articleModalBody: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
});
