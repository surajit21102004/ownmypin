import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { TRANSLATIONS } from '../constants/translations';
import { searchPin } from '../services/api';
import {
  SearchIcon,
  CloseIcon,
  GlobeIcon,
  AccountIcon,
  StoreIcon,
  StarIcon,
  BuildingIcon,
  HomeIcon,
  KeyIcon,
  ClipboardIcon,
  MapPinIcon,
  NavigationIcon,
  VerifiedCheckIcon,
} from '../components/SvgIcons';

// Dropdown Options
const SCOPE_OPTIONS = [
  { id: 'all', label: 'All', IconComponent: GlobeIcon, iconColor: '#0F172A', sub: 'Users & Businesses' },
  { id: 'user', label: 'App User', IconComponent: AccountIcon, iconColor: '#2563EB', sub: 'Residents & Homes' },
  { id: 'business', label: 'Business', IconComponent: StoreIcon, iconColor: '#D97706', sub: 'Shops & Commercial' },
];

const PROPERTY_OPTIONS = [
  { id: 'all', label: 'All', IconComponent: StarIcon, iconColor: '#D97706', sub: 'All Properties' },
  { id: 'flat', label: 'Flat', IconComponent: BuildingIcon, iconColor: '#7E22CE', sub: 'Apartments & Flats' },
  { id: 'house', label: 'House', IconComponent: HomeIcon, iconColor: '#2563EB', sub: 'Individual Houses' },
  { id: 'own', label: 'Own', IconComponent: KeyIcon, iconColor: '#047857', sub: 'Self-Owned' },
  { id: 'rent', label: 'Rent', IconComponent: ClipboardIcon, iconColor: '#C2410C', sub: 'Rented Properties' },
];

export default function SearchScreen({
  lang = 'en',
  onViewProfile,
  initialQuery = '',
}) {
  const t = TRANSLATIONS[lang]?.search || TRANSLATIONS.en.search;

  // Search States (Both Dropdowns Default to 'all')
  const [query, setQuery] = useState(initialQuery || '');
  const [searchScope, setSearchScope] = useState('all'); // 'all' | 'user' | 'business'
  const [selectedProperty, setSelectedProperty] = useState('all'); // 'all' | 'flat' | 'house' | 'own' | 'rent'
  const [loading, setLoading] = useState(false);
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [resultsList, setResultsList] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Dropdown Modal State: null | 'scope' | 'property'
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Debounce ref for live search
  const debounceTimerRef = useRef(null);

  const [recentSearches, setRecentSearches] = useState([
    'WB-09-78677628',
    'WB-09-45896524',
    'Rahul Sharma',
    'Flat',
    'Rent',
  ]);

  // Initial fetch on mount or query change
  useEffect(() => {
    performSearch(initialQuery || '', 'all', 'all', false);
  }, [initialQuery]);

  // Core Search Executor
  const performSearch = useCallback(
    async (
      searchTerm = '',
      propertyOverride = null,
      scopeOverride = null,
      isLive = false
    ) => {
      const scope = scopeOverride !== null ? scopeOverride : searchScope;
      const prop = propertyOverride !== null ? propertyOverride : selectedProperty;
      const term = searchTerm !== undefined ? searchTerm.trim() : query.trim();

      if (isLive) {
        setIsLiveSearching(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await searchPin(term, prop, scope);
        setHasSearched(true);

        if (res && res.success && res.profiles && res.profiles.length > 0) {
          setResultsList(res.profiles);
          setErrorMsg(null);

          // Add to recents if valid query
          if (term && term.length >= 2 && term.toLowerCase() !== 'all') {
            setRecentSearches((prev) => {
              const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
              return [term, ...filtered].slice(0, 5);
            });
          }
        } else {
          setResultsList([]);
          if (res && res.message) {
            setErrorMsg(res.message);
          } else {
            if (scope === 'user') {
              setErrorMsg('No App User found matching your search.');
            } else if (scope === 'business') {
              setErrorMsg('No Business found matching your search.');
            } else {
              setErrorMsg('No User or Business found matching your search.');
            }
          }
        }
      } catch (err) {
        setResultsList([]);
        if (scope === 'user') {
          setErrorMsg('No App User found matching your search.');
        } else if (scope === 'business') {
          setErrorMsg('No Business found matching your search.');
        } else {
          setErrorMsg('No User or Business found matching your search.');
        }
      } finally {
        setLoading(false);
        setIsLiveSearching(false);
      }
    },
    [query, searchScope, selectedProperty]
  );

  // Live typing handler with 280ms debounce
  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSearch(text, selectedProperty, searchScope, true);
    }, 280);
  };

  // Scope selection change
  const handleSelectScope = (scopeId) => {
    setSearchScope(scopeId);
    setActiveDropdown(null);
    performSearch(query, selectedProperty, scopeId, false);
  };

  // Property selection change
  const handleSelectProperty = (propId) => {
    setSelectedProperty(propId);
    setActiveDropdown(null);
    performSearch(query, propId, searchScope, false);
  };

  // Reset filters
  const handleResetSearch = () => {
    setQuery('');
    setSearchScope('all');
    setSelectedProperty('all');
    performSearch('', 'all', 'all', false);
  };

  const handleNavigate = (profile) => {
    if (!profile) return;
    if (profile.privacy_mode) {
      Alert.alert(
        '🔒 Privacy Protected',
        'This resident has enabled Privacy Mode. Exact coordinates are locked. Direct link or QR scan from the owner is required.'
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

  const currentScopeItem = SCOPE_OPTIONS.find((s) => s.id === searchScope) || SCOPE_OPTIONS[0];
  const currentPropertyItem = PROPERTY_OPTIONS.find((p) => p.id === selectedProperty) || PROPERTY_OPTIONS[0];

  const ScopeIcon = currentScopeItem.IconComponent;
  const PropertyIcon = currentPropertyItem.IconComponent;

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Compact Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Search Directory</Text>
          <Text style={styles.subtitle}>
            Verified digital addresses & local businesses live.
          </Text>
        </View>

        {/* Search Input Bar with SVG Icon & Live Indicator */}
        <View style={styles.searchBox}>
          <SearchIcon size={16} color="#64748B" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search PIN, resident name, or shop..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query, selectedProperty, searchScope, false)}
          />
          {isLiveSearching ? (
            <ActivityIndicator size="small" color="#0284C7" style={styles.liveSpinner} />
          ) : query.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                performSearch('', selectedProperty, searchScope, false);
              }}
            >
              <CloseIcon size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* --- TWO SIDE-BY-SIDE DROPDOWNS: (Search In) & (Property) --- */}
        <View style={styles.dropdownsRow}>
          {/* Dropdown 1: Search In (Default: All) */}
          <TouchableOpacity
            style={styles.dropdownField}
            activeOpacity={0.8}
            onPress={() => setActiveDropdown('scope')}
          >
            <Text style={styles.dropdownMiniLabel}>SEARCH IN</Text>
            <View style={styles.dropdownSelectRow}>
              <View style={styles.dropdownIconWrap}>
                <ScopeIcon size={14} color={currentScopeItem.iconColor} />
              </View>
              <Text style={styles.dropdownSelectedValue} numberOfLines={1}>
                {currentScopeItem.label}
              </Text>
              <Text style={styles.dropdownChevron}>▾</Text>
            </View>
          </TouchableOpacity>

          {/* Dropdown 2: Property (Default: All) */}
          <TouchableOpacity
            style={styles.dropdownField}
            activeOpacity={0.8}
            onPress={() => setActiveDropdown('property')}
          >
            <Text style={styles.dropdownMiniLabel}>PROPERTY</Text>
            <View style={styles.dropdownSelectRow}>
              <View style={styles.dropdownIconWrap}>
                <PropertyIcon size={14} color={currentPropertyItem.iconColor} />
              </View>
              <Text style={styles.dropdownSelectedValue} numberOfLines={1}>
                {currentPropertyItem.label}
              </Text>
              <Text style={styles.dropdownChevron}>▾</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Results Counter / Filter Indicator */}
        <View style={styles.resultsMetaBar}>
          <Text style={styles.resultsCountText}>
            {loading
              ? 'Searching directory...'
              : `Found ${resultsList.length} ${resultsList.length === 1 ? 'verified address' : 'verified addresses'}`}
          </Text>
          {(searchScope !== 'all' || selectedProperty !== 'all') && (
            <TouchableOpacity onPress={handleResetSearch}>
              <Text style={styles.resetFiltersLink}>Reset filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- CONTEXTUAL EMPTY STATE --- */}
        {hasSearched && !loading && resultsList.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              {searchScope === 'user' ? (
                <AccountIcon size={26} color="#64748B" />
              ) : searchScope === 'business' ? (
                <StoreIcon size={26} color="#64748B" />
              ) : (
                <SearchIcon size={26} color="#64748B" />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {searchScope === 'user'
                ? 'No App User Found'
                : searchScope === 'business'
                ? 'No Business Found'
                : 'No User or Business Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {errorMsg || 'Try adjusting the PIN code or property filter.'}
            </Text>
            <TouchableOpacity style={styles.emptyResetBtn} onPress={handleResetSearch}>
              <Text style={styles.emptyResetBtnText}>✨ Show All Listings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- CONCISE, PROFESSIONAL RESULT CARDS (SVG Badges & Icons) --- */}
        {resultsList.length > 0 && (
          <View style={styles.resultsListCol}>
            {resultsList.map((item, index) => {
              const isBiz = item.isBusiness || item.ownershipType === 'Commercial';

              return (
                <View key={item.pin || index} style={styles.conciseCard}>
                  {/* Card Header Row: Avatar + Details */}
                  <View style={styles.cardHeaderRow}>
                    {/* Selfie / Logo Avatar */}
                    <View style={styles.avatarWrap}>
                      {item.selfieUrl ? (
                        <Image source={{ uri: item.selfieUrl }} style={styles.avatarImg} resizeMode="cover" />
                      ) : (
                        <View style={[styles.avatarPlaceholder, isBiz && styles.avatarPlaceholderBiz]}>
                          <Text style={[styles.avatarInitial, isBiz && styles.avatarInitialBiz]}>
                            {(item.fullName || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.verifiedBadge, isBiz && styles.verifiedBadgeBiz]}>
                        <VerifiedCheckIcon size={9} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* Meta Col: Name + Tags + PIN */}
                    <View style={styles.cardMetaCol}>
                      <View style={styles.nameAndPinRow}>
                        <Text style={styles.residentName} numberOfLines={1}>
                          {item.fullName}
                        </Text>
                        <View style={styles.pinTagPill}>
                          <Text style={styles.pinTagText}>{item.pin}</Text>
                        </View>
                      </View>

                      {/* Explicit Property & Status Tags with SVG Icons */}
                      <View style={styles.tagsRow}>
                        {isBiz ? (
                          <>
                            <View style={styles.tagBiz}>
                              <StoreIcon size={11} color="#92400E" />
                              <Text style={styles.tagBizText}>Business</Text>
                            </View>
                            <View style={styles.tagCategory}>
                              <Text style={styles.tagCategoryText} numberOfLines={1}>
                                {item.propertyType || 'Shop'}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            {/* Property Tag: Flat / House */}
                            <View
                              style={[
                                styles.tagProp,
                                item.propertyType === 'Flat' && styles.tagFlat,
                              ]}
                            >
                              {item.propertyType === 'Flat' ? (
                                <BuildingIcon size={11} color="#5B21B6" />
                              ) : (
                                <HomeIcon size={11} color="#7E22CE" />
                              )}
                              <Text
                                style={[
                                  styles.tagPropText,
                                  item.propertyType === 'Flat' && styles.tagFlatText,
                                ]}
                              >
                                {item.propertyType === 'Flat' ? 'Property: Flat' : 'Property: House'}
                              </Text>
                            </View>

                            {/* Status Tag: Own / Rent */}
                            <View
                              style={[
                                styles.tagStatus,
                                item.ownershipType === 'Rent' && styles.tagRent,
                              ]}
                            >
                              {item.ownershipType === 'Rent' ? (
                                <ClipboardIcon size={11} color="#C2410C" />
                              ) : (
                                <KeyIcon size={11} color="#047857" />
                              )}
                              <Text
                                style={[
                                  styles.tagStatusText,
                                  item.ownershipType === 'Rent' && styles.tagRentText,
                                ]}
                              >
                                {item.ownershipType === 'Rent' ? 'Status: Rent' : 'Status: Own'}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>

                      {/* Location & Rating */}
                      <View style={styles.locationRow}>
                        <View style={styles.locIconTextRow}>
                          <MapPinIcon size={12} color="#64748B" />
                          <Text style={styles.locationText} numberOfLines={1}>
                            {item.privacy_mode ? `${item.city || 'Area'}, ${item.district || 'District'}` : item.location}
                          </Text>
                        </View>
                        <View style={styles.starRatingRow}>
                          <StarIcon size={11} color="#D97706" />
                          <Text style={styles.starText}>{item.rating || '4.8'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Concise Actions: View Profile (only then see photos) & Navigate with SVG Icons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.viewProfileBtn}
                      activeOpacity={0.8}
                      onPress={() => onViewProfile(item)}
                    >
                      {isBiz ? (
                        <StoreIcon size={13} color="#0F172A" />
                      ) : (
                        <AccountIcon size={13} color="#0F172A" />
                      )}
                      <Text style={styles.viewProfileBtnText}>
                        {isBiz ? 'View Shop & Photos' : 'View Profile & Photos'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.navigateBtn, item.privacy_mode && { backgroundColor: '#64748B' }]}
                      activeOpacity={0.8}
                      onPress={() => handleNavigate(item)}
                    >
                      <NavigationIcon size={12} color="#FFFFFF" />
                      <Text style={styles.navigateBtnText}>
                        {item.privacy_mode ? 'Locked' : 'Navigate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Recent Searches */}
        <View style={styles.recentsSection}>
          <Text style={styles.recentsHeading}>Recent Searches</Text>
          <View style={styles.recentsRow}>
            {recentSearches.map((pinItem, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.recentChip}
                activeOpacity={0.7}
                onPress={() => {
                  setQuery(pinItem);
                  performSearch(pinItem, selectedProperty, searchScope, false);
                }}
              >
                <Text style={styles.recentChipText}>{pinItem}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* --- SELECTION DROPDOWN MODAL SHEET --- */}
      <Modal
        visible={activeDropdown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveDropdown(null)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {activeDropdown === 'scope' ? 'Select Search In' : 'Filter by Property'}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <CloseIcon size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <View style={styles.modalOptionsList}>
              {activeDropdown === 'scope'
                ? SCOPE_OPTIONS.map((item) => {
                    const isSelected = searchScope === item.id;
                    const ItemIcon = item.IconComponent;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.modalOptionRow, isSelected && styles.modalOptionRowActive]}
                        onPress={() => handleSelectScope(item.id)}
                      >
                        <View style={styles.modalOptionIconWrap}>
                          <ItemIcon size={18} color={item.iconColor} />
                        </View>
                        <View style={styles.modalOptionTextCol}>
                          <Text style={[styles.modalOptionTitle, isSelected && styles.modalOptionTitleActive]}>
                            {item.label}
                          </Text>
                          <Text style={styles.modalOptionSub}>{item.sub}</Text>
                        </View>
                        {isSelected && <VerifiedCheckIcon size={16} color="#2563EB" />}
                      </TouchableOpacity>
                    );
                  })
                : PROPERTY_OPTIONS.map((item) => {
                    const isSelected = selectedProperty === item.id;
                    const ItemIcon = item.IconComponent;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.modalOptionRow, isSelected && styles.modalOptionRowActive]}
                        onPress={() => handleSelectProperty(item.id)}
                      >
                        <View style={styles.modalOptionIconWrap}>
                          <ItemIcon size={18} color={item.iconColor} />
                        </View>
                        <View style={styles.modalOptionTextCol}>
                          <Text style={[styles.modalOptionTitle, isSelected && styles.modalOptionTitleActive]}>
                            {item.label}
                          </Text>
                          <Text style={styles.modalOptionSub}>{item.sub}</Text>
                        </View>
                        {isSelected && <VerifiedCheckIcon size={16} color="#2563EB" />}
                      </TouchableOpacity>
                    );
                  })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerBlock: {
    marginBottom: 12,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },

  // Search Input Bar
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0,
  },
  liveSpinner: {
    paddingHorizontal: 4,
  },

  // TWO SIDE-BY-SIDE DROPDOWNS ROW
  dropdownsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dropdownField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownMiniLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  dropdownSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownIconWrap: {
    marginRight: 6,
  },
  dropdownSelectedValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownChevron: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '800',
    marginLeft: 4,
  },

  // Results meta bar
  resultsMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  resetFiltersLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },

  // CONCISE RESULT CARDS (Professional & Compact)
  resultsListCol: {
    gap: 10,
    marginBottom: 18,
  },
  conciseCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginTop: 2,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  avatarPlaceholderBiz: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  avatarInitialBiz: {
    color: '#B45309',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifiedBadgeBiz: {
    backgroundColor: '#0284C7',
  },

  cardMetaCol: {
    flex: 1,
  },
  nameAndPinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  residentName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  pinTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pinTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: 'monospace',
  },

  // Tags Row
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  tagProp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagPropText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7E22CE',
  },
  tagFlat: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  tagFlatText: {
    color: '#5B21B6',
  },
  tagStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  tagRent: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  tagRentText: {
    color: '#C2410C',
  },
  tagBiz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagBizText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  tagCategory: {
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    maxWidth: 140,
  },
  tagCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },

  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locIconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 6,
  },
  locationText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  starRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starText: {
    fontSize: 11.5,
    color: '#D97706',
    fontWeight: '700',
  },

  // Action Buttons
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 9,
  },
  viewProfileBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingVertical: 7,
    borderRadius: 9,
  },
  viewProfileBtnText: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '700',
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingVertical: 7,
    borderRadius: 9,
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Empty State Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  emptyResetBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },

  // Recent Searches
  recentsSection: {
    marginTop: 4,
  },
  recentsHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
  },
  recentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  recentChipText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },

  // MODAL SHEET STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 18,
    maxHeight: '60%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalOptionsList: {
    gap: 8,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  modalOptionRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  modalOptionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOptionTextCol: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalOptionTitleActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  modalOptionSub: {
    fontSize: 11,
    color: '#64748B',
  },
});
