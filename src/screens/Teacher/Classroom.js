import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Modal,
  Pressable,
  Animated,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {useAuth} from '../../auth/AuthContext';
import {fetchClassroomByTeacher} from '../../util/Apicall';
import {useNavigation} from '@react-navigation/native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────

const academicYearsList = [
  'All Academic Years',
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029',
  '2029-2030',
  '2030-2031',
];

const normalizeYear = year => {
  if (!year) return '--';
  if (/^\d{4}$/.test(year)) return `${year}-${parseInt(year, 10) + 1}`;
  return year;
};

const ACTION_BUTTONS = [
  {
    key: 'student',
    label: 'Students',
    icon: 'people-outline',
    color: '#6366F1',
    bg: '#EEF2FF',
    navigate: (navigation, item) =>
      navigation.navigate('Student', {classroom: item}),
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: 'calendar-outline',
    color: '#059669',
    bg: '#ECFDF5',
    navigate: navigation => navigation.navigate('Attendance'),
  },
  {
    key: 'timetable',
    label: 'Timetable',
    icon: 'time-outline',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    navigate: (navigation, item) =>
      navigation.navigate('Timetable', {classroom: item}),
  },
  {
    key: 'assignment',
    label: 'Assignments',
    icon: 'document-text-outline',
    color: '#D97706',
    bg: '#FEF3C7',
    navigate: navigation => navigation.navigate('Assignment'),
  },
];

// ─────────────────────────────────────────────────────────────
// SKELETON LOADER COMPONENT
// ─────────────────────────────────────────────────────────────

const SkeletonCard = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.skeletonCard, {opacity: pulseAnim}]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={{flex: 1, gap: 6}}>
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineShort} />
        </View>
      </View>
      <View style={styles.skeletonGrid}>
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
// ULTRA-COMPACT CLASSROOM CARD
// ─────────────────────────────────────────────────────────────

const ClassroomCard = ({item, index, onAssignMarks, navigation}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY, index]);

  const subjectList = item.subjectName
    ? item.subjectName
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{translateY}],
        },
      ]}>
      {/* HEADER ROW */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.classIconBadge}>
            <Ionicons name="school" size={18} color="#6366F1" />
          </View>
          <View style={styles.titleArea}>
            <View style={styles.titleRow}>
              <Text style={styles.batchName} numberOfLines={1}>
                {item.batchName}
              </Text>
              <View style={styles.indexPill}>
                <Text style={styles.indexPillText}>
                  #{String(index + 1).padStart(2, '0')}
                </Text>
              </View>
            </View>
            <Text style={styles.courseNameText} numberOfLines={1}>
              {item.courseName}
            </Text>
          </View>
        </View>
      </View>

      {/* METADATA + INLINE ASSIGN MARKS ACTION ROW */}
      <View style={styles.inlineMetaContainer}>
        <View style={styles.metaGroup}>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={11} color="#6366F1" />
            <Text style={styles.metaValue}>{item.academicYear}</Text>
          </View>

          <View style={styles.metaChip}>
            <Ionicons name="language-outline" size={11} color="#0284C7" />
            <Text style={styles.metaValue}>{item.mediumName}</Text>
          </View>
        </View>

        {/* INLINE ACTION PILL */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.inlineAssignBtn}
          onPress={() => onAssignMarks(item)}>
          <Ionicons name="create-outline" size={13} color="#4F46E5" />
          <Text style={styles.inlineAssignText}>Assign Marks</Text>
          <Ionicons name="chevron-forward" size={12} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* SUBJECT CHIPS ROW */}
      {subjectList.length > 0 && (
        <View style={styles.subjectContainer}>
          <Ionicons
            name="book-outline"
            size={12}
            color="#64748B"
            style={styles.bookIcon}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectScroll}>
            {subjectList.map((sub, i) => (
              <View key={i} style={styles.compactSubjectChip}>
                <Text style={styles.compactSubjectText}>{sub}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* QUICK ACTION BUTTONS */}
      <View style={styles.quickActionsContainer}>
        {ACTION_BUTTONS.map(btn => (
          <TouchableOpacity
            key={btn.key}
            activeOpacity={0.75}
            style={styles.quickActionChip}
            onPress={() => btn.navigate(navigation, item)}>
            <View style={[styles.quickActionIcon, {backgroundColor: btn.bg}]}>
              <Ionicons name={btn.icon} size={14} color={btn.color} />
            </View>
            <Text style={[styles.quickActionLabel, {color: btn.color}]}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────

const Classroom = () => {
  const {userData} = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState('All Academic Years');

  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
  });

  const navigation = useNavigation();

  const openDropdown = () => {
    if (!dropdownRef.current) return;
    dropdownRef.current.measure((x, y, width, height, pageX, pageY) => {
      const itemHeight = 42;
      const maxItems = 4;
      const calculatedHeight = Math.min(
        academicYearsList.length * itemHeight,
        itemHeight * maxItems,
      );

      const rightOffset = SCREEN_WIDTH - (pageX + width);

      setDropdownPosition({
        top: pageY + height + 6,
        right: Math.max(rightOffset, 16),
        width: Math.max(width, 160),
      });
      dropdownHeight.setValue(0);
      dropdownOpacity.setValue(0);
      setShouldRenderDropdown(true);

      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: calculatedHeight,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(dropdownHeight, {
        toValue: 0,
        duration: 140,
        useNativeDriver: false,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 110,
        useNativeDriver: false,
      }),
    ]).start(() => setShouldRenderDropdown(false));
  };

  const handleSelectYear = year => {
    setSelectedAcademicYear(year);
    closeDropdown();
  };

  const loadClassrooms = async () => {
    try {
      setRefreshing(true);
      const result = await fetchClassroomByTeacher(userData?.email);
      const transformed = result.map(item => ({
        id: item.id,
        batchName: item.batchName,
        academicYear: normalizeYear(item.academicYear),
        mediumName: item.medium?.mediumName || '--',
        courseName: item.course?.coursename || '--',
        subjectName: item.subjects?.map(s => s.subjectName).join(', ') || '--',
        subjects: item.subjects || [],
      }));
      setClassrooms(transformed);
    } catch (error) {
      console.error('Failed to fetch classrooms:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userData?.email) loadClassrooms();
  }, [userData?.email]);

  const filteredClassrooms =
    selectedAcademicYear === 'All Academic Years'
      ? classrooms
      : classrooms.filter(c => c.academicYear === selectedAcademicYear);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (filteredClassrooms.length === 0) {
      return (
        <View style={styles.centeredState}>
          <Ionicons name="school-outline" size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Classrooms Available</Text>
          <Text style={styles.emptySubtext}>
            Try clearing filters or changing academic year.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredClassrooms}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={({item, index}) => (
          <ClassroomCard
            item={item}
            index={index}
            navigation={navigation}
            onAssignMarks={classroom => {
              navigation.navigate('AssignMarks', {classroom});
            }}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadClassrooms}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

      <View style={styles.content}>
        {/* TOP COMPACT BAR */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Ionicons
              name="school"
              size={17}
              color="#6366F1"
              style={{marginRight: 6}}
            />
            <Text style={styles.screenTitle}>CLASSROOMS</Text>
          </View>

          <Pressable
            ref={dropdownRef}
            style={styles.yearFilter}
            onPress={openDropdown}>
            <Ionicons
              name="funnel-outline"
              size={11}
              color="#6366F1"
              style={{marginRight: 5}}
            />
            <Text style={styles.yearFilterText} numberOfLines={1}>
              {selectedAcademicYear === 'All Academic Years'
                ? 'All Years'
                : selectedAcademicYear}
            </Text>
            <Ionicons name="chevron-down" size={11} color="#6366F1" />
          </Pressable>

          {shouldRenderDropdown && (
            <Modal transparent visible onRequestClose={closeDropdown}>
              <Pressable style={styles.dropdownOverlay} onPress={closeDropdown}>
                <Animated.View
                  style={[
                    styles.dropdownMenu,
                    {
                      position: 'absolute',
                      top: dropdownPosition.top,
                      right: dropdownPosition.right,
                      width: dropdownPosition.width,
                      height: dropdownHeight,
                      opacity: dropdownOpacity,
                    },
                  ]}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}>
                    {academicYearsList.map(year => (
                      <Pressable
                        key={year}
                        style={[
                          styles.dropdownItem,
                          selectedAcademicYear === year &&
                            styles.dropdownItemActive,
                        ]}
                        onPress={() => handleSelectYear(year)}>
                        {selectedAcademicYear === year && (
                          <Ionicons
                            name="checkmark"
                            size={13}
                            color="#6366F1"
                            style={{marginRight: 6}}
                          />
                        )}
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedAcademicYear === year &&
                              styles.dropdownItemTextActive,
                          ]}>
                          {year}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Animated.View>
              </Pressable>
            </Modal>
          )}
        </View>

        {!loading && filteredClassrooms.length > 0 && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {filteredClassrooms.length} Active Classroom
              {filteredClassrooms.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {renderContent()}
      </View>

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default Classroom;

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  yearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  yearFilterText: {
    fontSize: SCREEN_WIDTH < 360 ? 10 : 11,
    color: '#4338CA',
    fontWeight: '600',
    marginRight: 4,
    flexShrink: 1,
  },

  // Dropdown
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: SCREEN_HEIGHT * 0.35,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    fontSize: SCREEN_WIDTH < 360 ? 11 : 12,
    color: '#475569',
  },
  dropdownItemTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },

  // Count Header
  countRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  countText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Cards List
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // Redesigned Card Architecture
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  titleArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  indexPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  indexPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  courseNameText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Inline Metadata + Action Row
  inlineMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaValue: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: '600',
  },
  inlineAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  inlineAssignText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Subject Chips Row
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookIcon: {
    marginRight: 6,
  },
  subjectScroll: {
    gap: 5,
  },
  compactSubjectChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  compactSubjectText: {
    fontSize: 10,
    color: '#4338CA',
    fontWeight: '600',
  },

  // Floating Quick Action Chips
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  quickActionChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickActionIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  quickActionLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Empty & Skeleton States
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  skeletonLineLong: {
    height: 11,
    width: '55%',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonLineShort: {
    height: 9,
    width: '30%',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonChip: {
    flex: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
});
