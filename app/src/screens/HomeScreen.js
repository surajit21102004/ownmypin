import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Clipboard,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { getAdsAndSettings, getDailyNews, getPinQrCodeUrl, getAppLaunchPopup } from '../services/api';
import NearbyBusinessesModal from '../components/NearbyBusinessesModal';
import InviteModal from '../components/InviteModal';
import AppLaunchOfferModal from '../components/AppLaunchOfferModal';
import {
  BellIcon,
  SearchIcon,
  ScannerIcon,
  MapPinIcon,
  GiftIcon,
  ShareIcon,
  CopyIcon,
  StoreIcon,
  VerifiedCheckIcon,
} from '../components/SvgIcons';

const DIGILOCKER_LOGO = require('../../assets/digilocker.png');

// Session-level flag: only show the launch popup ONCE per app open/session
let hasShownAppLaunchPopupInSession = false;

export default function HomeScreen({
  user,
  registration,
  onOpenQrModal,
  onNavigateToSearch,
  onNavigateToScanner,
  onNavigateToDsc,
  onNavigateToRegister,
  onOpenNotifications,
  onNavigateToAccount,
  unreadCount = 1,
}) {
  const CARD_WIDTH = Dimensions.get('window').width - 40;

  const [copiedToast, setCopiedToast] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showLaunchPopup, setShowLaunchPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);

  // Ads List from Admin Panel
  const [adsList, setAdsList] = useState([
    {
      id: 101,
      title: 'Get 20% off Now on Apna Mart',
      description: 'Flat 20% discount on fresh daily essentials and grocery delivery in Rishra',
      category: 'Sponsored',
      image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=60',
      business_name: 'Apna Mart - Rishra',
      distance: '0.4 km',
    },
    {
      id: 102,
      title: 'City Medico & Diagnostic 24x7',
      description: 'Emergency medicine doorstep delivery and diagnostic tests available at home',
      category: 'Healthcare',
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60',
      business_name: 'City Medico',
      distance: '0.9 km',
    },
    {
      id: 103,
      title: 'Aroma Bakery & Cafe Specials',
      description: 'Freshly baked artisan sourdough, cakes, and hand-brewed coffees near you',
      category: 'Food & Dining',
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=60',
      business_name: 'Aroma Cafe',
      distance: '1.2 km',
    },
  ]);

  // News List from Admin Panel
  const [newsList, setNewsList] = useState([
    {
      id: 201,
      headline: 'Local Commercial Hubs in Hooghly District Go Fully Digital',
      summary: 'Over 500 local traders and shops registered their business pins for delivery partner accuracy.',
      category: 'Local Business',
      image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60',
      source: 'Business Daily',
      time_ago: '1d ago',
    },
    {
      id: 202,
      headline: 'West Bengal Launches Unified Digital Pin Portal with OwnMyPin',
      summary: 'Citizens can now register their residential and commercial properties for tamper-proof digital addresses.',
      category: 'Government & Postal',
      image_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=60',
      source: 'OwnMyPin News Desk',
      time_ago: '2h ago',
    },
  ]);

  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const adScrollRef = useRef(null);

  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const newsScrollRef = useRef(null);

  useEffect(() => {
    loadContent();
  }, []);

  // Auto-scroll loop for Ads (every 3.8s in continuous loop)
  useEffect(() => {
    if (adsList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAdIndex((prev) => {
        const next = (prev + 1) % adsList.length;
        adScrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 3800);
    return () => clearInterval(interval);
  }, [adsList.length, CARD_WIDTH]);

  // Auto-scroll loop for News (every 4.5s in continuous loop)
  useEffect(() => {
    if (newsList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveNewsIndex((prev) => {
        const next = (prev + 1) % newsList.length;
        newsScrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [newsList.length, CARD_WIDTH]);

  const loadContent = async () => {
    try {
      const [adsRes, newsRes, popupRes] = await Promise.all([
        getAdsAndSettings(),
        getDailyNews(),
        getAppLaunchPopup(),
      ]);

      if (adsRes && adsRes.ads && adsRes.ads.length > 0) {
        setAdsList(adsRes.ads);
      }
      if (newsRes && newsRes.news && newsRes.news.length > 0) {
        setNewsList(newsRes.news);
      }
      if (popupRes && popupRes.success && popupRes.popup && popupRes.popup.enabled) {
        setPopupData(popupRes.popup);
        if (!hasShownAppLaunchPopupInSession) {
          setShowLaunchPopup(true);
          hasShownAppLaunchPopupInSession = true;
        }
      }
    } catch (e) {
      // keep fallback
    }
  };

  const handlePopupRedirect = (action) => {
    if (action === 'refer') {
      setShowInvite(true);
    } else if (action === 'scanner') {
      onNavigateToScanner();
    } else if (action === 'register') {
      onNavigateToRegister();
    } else if (action === 'nearby') {
      setShowNearby(true);
    } else if (action === 'dsc') {
      onNavigateToDsc();
    }
  };

  // Determine user registration status
  const isRegistered = !!registration;
  const isApproved = registration && registration.status === 'approved';
  const isPending = registration && registration.status === 'pending';
  const isDigilockerVerified = Boolean(registration?.is_aadhaar_verified || user?.is_aadhaar_verified);

  const pin =
    (registration && (registration.pin_code || registration.verified_pin_code)) ||
    (isApproved ? 'WB-09-45896524' : '');
  const fullName =
    (registration && registration.full_name) || (user && user.full_name) || (isApproved ? 'Rahul Sharma' : 'Member');
  const locationText = registration?.address_line
    ? `${registration.address_line}, ${registration.city || 'West Bengal'}`
    : 'Rishra, Hooghly, West Bengal';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const handleCopyPin = () => {
    if (!pin) {
      if (onNavigateToRegister) onNavigateToRegister();
      return;
    }
    Clipboard.setString(pin);
    setCopiedToast(true);
    Alert.alert('PIN Copied', `OwnMyPIN: ${pin} copied to clipboard!`);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleShareQr = async () => {
    if (!pin) {
      if (onNavigateToRegister) onNavigateToRegister();
      return;
    }
    try {
      await Share.share({
        title: 'My OwnMyPin QR Code',
        message: `My official OwnMyPin DIGIPIN is ${pin} (${fullName}). Navigate to my doorstep or scan QR: https://ownmypin.com/location?pin=${encodeURIComponent(pin)}`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------------- */}
        {/* TOP BAR: Logo + Bell + Avatar (Matches Screenshot 1)         */}
        {/* ----------------------------------------------------------- */}
        <View style={styles.topBar}>
          <Image
            source={require('../../assets/ownmypin.png')}
            style={styles.topLogo}
            resizeMode="contain"
          />

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.bellBtn}
              activeOpacity={0.8}
              onPress={onOpenNotifications}
            >
              <BellIcon size={21} color="#0F172A" />
              {unreadCount > 0 && <View style={styles.redDotBadge} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              activeOpacity={0.8}
              onPress={onNavigateToAccount}
            >
              <Text style={styles.avatarText}>
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ----------------------------------------------------------- */}
        {/* GREETING & NAME (Matches Screenshot 1)                       */}
        {/* ----------------------------------------------------------- */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>{getGreeting()}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{fullName}</Text>
            <View style={styles.greenVerifiedCircle}>
              <VerifiedCheckIcon size={11} color="#FFFFFF" />
            </View>
            {isDigilockerVerified && (
              <View style={styles.dlHomeBadge}>
                <Image source={DIGILOCKER_LOGO} style={{ width: 13, height: 13, marginRight: 3 }} resizeMode="contain" />
                <Text style={styles.dlHomeBadgeText}>DigiLocker</Text>
              </View>
            )}
          </View>
        </View>
        {/* ----------------------------------------------------------- */}
        {/* YOUR OWNMYPIN CARD (Matches Screenshot 1)                   */}
        {/* ----------------------------------------------------------- */}
        <View style={styles.ownmypinCard}>
          <View style={styles.cardMainRow}>
            <View style={styles.cardLeftCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={styles.cardHeaderLabel}>YOUR OWNMYPIN</Text>
                {isDigilockerVerified && (
                  <View style={styles.dlCardPill}>
                    <Image source={DIGILOCKER_LOGO} style={{ width: 12, height: 12, marginRight: 3 }} resizeMode="contain" />
                    <Text style={styles.dlCardPillText}>Verified by DigiLocker</Text>
                  </View>
                )}
              </View>
              {isApproved || (!registration && pin) ? (
                <>
                  <Text style={styles.cardPinText}>{pin || 'WB-09-45896524'}</Text>
                  <Text style={styles.cardLocationText}>{locationText}</Text>
                </>
              ) : isPending ? (
                <>
                  <Text style={[styles.cardPinText, { color: '#F59E0B', fontSize: 18 }]}>
                    Status: Pending Verification
                  </Text>
                  <Text style={styles.cardLocationText}>
                    Doorstep verification in progress
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.cardPinText, { color: '#F59E0B', fontSize: 18 }]}>
                    No PIN Created Yet
                  </Text>
                  <Text style={styles.cardLocationText}>
                    Register to get your digital address
                  </Text>
                </>
              )}
            </View>

            {/* White QR Code Square */}
            <TouchableOpacity
              style={styles.qrSquare}
              activeOpacity={0.85}
              onPress={() => onOpenQrModal && onOpenQrModal(pin || 'WB-09-45896524', fullName)}
            >
              {isApproved || (!registration && pin) ? (
                <Image
                  source={{ uri: getPinQrCodeUrl(pin || 'WB-09-45896524') }}
                  style={styles.qrSquareImg}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.qrPendingEmoji}>{isPending ? '⏳' : '📍'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.cardButtonsRow}>
            {isApproved || (!registration && pin) ? (
              <>
                <TouchableOpacity
                  style={styles.shareQrBtn}
                  activeOpacity={0.85}
                  onPress={handleShareQr}
                >
                  <ShareIcon size={14} color="#0F172A" />
                  <Text style={styles.shareQrBtnText}>Share QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.copyPinBtn}
                  activeOpacity={0.85}
                  onPress={handleCopyPin}
                >
                  <CopyIcon size={14} color="#FFFFFF" />
                  <Text style={styles.copyPinBtnText}>
                    {copiedToast ? 'Copied!' : 'Copy PIN'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : isPending ? (
              <>
                <TouchableOpacity
                  style={styles.shareQrBtn}
                  activeOpacity={0.85}
                  onPress={() => onNavigateToRegister && onNavigateToRegister()}
                >
                  <Text style={styles.shareQrBtnText}>Track Application</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.copyPinBtn}
                  activeOpacity={0.85}
                  onPress={() => onNavigateToRegister && onNavigateToRegister()}
                >
                  <Text style={styles.copyPinBtnText}>View Details</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.shareQrBtn}
                  activeOpacity={0.85}
                  onPress={() => onNavigateToRegister && onNavigateToRegister()}
                >
                  <Text style={styles.shareQrBtnText}>Register Your PIN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.copyPinBtn}
                  activeOpacity={0.85}
                  onPress={() => setShowNearby(true)}
                >
                  <Text style={styles.copyPinBtnText}>Explore Map</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ----------------------------------------------------------- */}
        {/* QUICK ACTIONS ROW: 4 Cards (Matches Screenshot 1)            */}
        {/* ----------------------------------------------------------- */}
        <View style={styles.quickActionsRow}>
          {/* 1. Search PIN */}
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.75}
            onPress={onNavigateToSearch}
          >
            <View style={styles.quickActionIconWrap}>
              <SearchIcon size={20} color="#0F172A" />
            </View>
            <Text style={styles.quickActionLabel}>Search PIN</Text>
          </TouchableOpacity>

          {/* 2. Scan QR */}
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.75}
            onPress={onNavigateToScanner}
          >
            <View style={styles.quickActionIconWrap}>
              <ScannerIcon size={20} color="#0F172A" />
            </View>
            <Text style={styles.quickActionLabel}>Scan QR</Text>
          </TouchableOpacity>

          {/* 3. Nearby */}
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.75}
            onPress={() => setShowNearby(true)}
          >
            <View style={styles.quickActionIconWrap}>
              <MapPinIcon size={20} color="#0F172A" />
            </View>
            <Text style={styles.quickActionLabel}>Nearby</Text>
          </TouchableOpacity>

          {/* 4. Invite */}
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.75}
            onPress={() => setShowInvite(true)}
          >
            <View style={styles.quickActionIconWrap}>
              <GiftIcon size={20} color="#0F172A" />
            </View>
            <Text style={styles.quickActionLabel}>Invite</Text>
          </TouchableOpacity>
        </View>

        {/* ----------------------------------------------------------- */}
        {/* TODAY SECTION - ADMIN ADS CAROUSEL (Matches Screenshot 1)    */}
        {/* ----------------------------------------------------------- */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeaderRow}>
            <View style={styles.todayHeaderLeft}>
              <Text style={styles.todayTitle}>Today</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Active Deals</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowNearby(true)}>
              <Text style={styles.seeAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Ads Carousel */}
          <ScrollView
            ref={adScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
              setActiveAdIndex(idx);
            }}
            contentContainerStyle={styles.carouselContent}
          >
            {adsList.map((ad, idx) => (
              <TouchableOpacity
                key={ad.id || idx}
                activeOpacity={0.9}
                style={[styles.todayCard, { width: CARD_WIDTH }]}
                onPress={() => {
                  Alert.alert(
                    ad.title || 'Special Offer',
                    `${ad.description || ''}\n\n🏪 ${ad.business_name || 'Verified Merchant'}${ad.distance ? ' · ' + ad.distance : ''}`
                  );
                }}
              >
                <View style={styles.todayImagePlaceholder}>
                  <View style={styles.adBadge}>
                    <Text style={styles.adBadgeText}>Ad</Text>
                  </View>
                  {ad.image_url ? (
                    <Image source={{ uri: ad.image_url }} style={styles.todayBannerImg} resizeMode="cover" />
                  ) : (
                    <Text style={styles.imagePlaceholderText}>Verified Partner Showcase</Text>
                  )}
                </View>

                <View style={styles.todayCardMeta}>
                  <Text style={styles.todayContentTitle} numberOfLines={1}>{ad.title}</Text>
                  <Text style={styles.todayContentDesc} numberOfLines={2}>
                    {ad.description}
                  </Text>
                  {ad.business_name ? (
                    <Text style={styles.adMerchantRow}>
                      🏪 {ad.business_name} {ad.distance ? `· ${ad.distance}` : ''}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ad Carousel Pagination Dots */}
          {adsList.length > 1 && (
            <View style={styles.dotsRow}>
              {adsList.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setActiveAdIndex(i);
                    adScrollRef.current?.scrollTo({ x: i * CARD_WIDTH, animated: true });
                  }}
                  style={[styles.dotPill, i === activeAdIndex && styles.dotPillActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ----------------------------------------------------------- */}
        {/* DAILY NEWS SECTION - ADMIN NEWS CAROUSEL                     */}
        {/* ----------------------------------------------------------- */}
        <View style={styles.newsSection}>
          <View style={styles.todayHeaderRow}>
            <View style={styles.todayHeaderLeft}>
              <Text style={styles.todayTitle}>Daily News</Text>
              <View style={styles.newsBadgePill}>
                <Text style={styles.newsBadgePillText}>DSC</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onNavigateToDsc}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal News Carousel */}
          <ScrollView
            ref={newsScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
              setActiveNewsIndex(idx);
            }}
            contentContainerStyle={styles.carouselContent}
          >
            {newsList.map((item, idx) => (
              <TouchableOpacity
                key={item.id || idx}
                activeOpacity={0.9}
                style={[styles.newsCard, { width: CARD_WIDTH }]}
                onPress={onNavigateToDsc}
              >
                <View style={styles.newsImageWrap}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category || 'Local Update'}</Text>
                  </View>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.newsBannerImg} resizeMode="cover" />
                  ) : (
                    <Text style={styles.imagePlaceholderText}>OwnMyPin News</Text>
                  )}
                </View>

                <View style={styles.newsCardMeta}>
                  <Text style={styles.newsHeadline} numberOfLines={2}>{item.headline}</Text>
                  <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                  <View style={styles.newsFooterRow}>
                    <Text style={styles.newsSource}>{item.source || 'News Desk'}</Text>
                    <Text style={styles.newsTime}>{item.time_ago || 'Recent'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* News Carousel Pagination Dots */}
          {newsList.length > 1 && (
            <View style={styles.dotsRow}>
              {newsList.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setActiveNewsIndex(i);
                    newsScrollRef.current?.scrollTo({ x: i * CARD_WIDTH, animated: true });
                  }}
                  style={[styles.dotPill, i === activeNewsIndex && styles.dotPillActive]}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Nearby Businesses Modal */}
      <NearbyBusinessesModal visible={showNearby} onClose={() => setShowNearby(false)} />

      {/* Invite Modal */}
      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        pin={pin || 'WB-09-45896524'}
      />

      {/* App Launch Special Offer Popup (controlled by Admin Panel) */}
      <AppLaunchOfferModal
        visible={showLaunchPopup}
        popupData={popupData}
        onClose={() => setShowLaunchPopup(false)}
        onActionRedirect={handlePopupRedirect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  topLogo: {
    width: 145,
    height: 44,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  redDotBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#112240',
    fontSize: 18,
    fontWeight: '800',
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingSub: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  greenVerifiedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenVerifiedCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  ownmypinCard: {
    backgroundColor: '#0F1D36',
    borderRadius: 24,
    padding: 20,
    marginBottom: 22,
    shadowColor: '#0F1D36',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardLeftCol: {
    flex: 1,
    marginRight: 12,
  },
  cardHeaderLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cardPinText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardLocationText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  qrSquare: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSquareImg: {
    width: '100%',
    height: '100%',
  },
  qrPendingEmoji: {
    fontSize: 32,
  },
  cardButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shareQrBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareQrBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  copyPinBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyPinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  todaySection: {
    marginBottom: 24,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 4,
  },
  liveText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
  todayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carouselContent: {
    flexDirection: 'row',
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  todayImagePlaceholder: {
    height: 140,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  todayBannerImg: {
    width: '100%',
    height: '100%',
  },
  adBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#0F1D36',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  imagePlaceholderText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  todayCardMeta: {
    paddingTop: 12,
  },
  todayContentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  todayContentDesc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 6,
  },
  adMerchantRow: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dotPill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotPillActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  newsSection: {
    marginBottom: 30,
  },
  newsBadgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  newsBadgePillText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  newsImageWrap: {
    height: 140,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  newsBannerImg: {
    width: '100%',
    height: '100%',
  },
  newsCardMeta: {
    paddingTop: 12,
  },
  newsHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 20,
  },
  newsSummary: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 8,
  },
  newsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  newsTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dlHomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  dlHomeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3730A3',
  },
  dlCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dlCardPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
