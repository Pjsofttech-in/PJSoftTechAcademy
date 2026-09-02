import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Animated,
  Pressable,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import {Users, Clock, AlertCircle} from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {useAuth} from '../../auth/AuthContext';
import {
  fetchClassroomByTeacher,
  fetchAttendanceDataByTeacher,
} from '../../util/Apicall';
import {useNavigation} from '@react-navigation/native';

const {width: screenWidth} = Dimensions.get('window');

// ─── Format time helper ────────────────────────────────────────────────────────
const formatTime = timeStr => {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

// ─── Attendance Card ──────────────────────────────────────────────────────────
const AttendanceCard = React.memo(({classroom, stats, index, onPress}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        delay: Math.min(index, 8) * 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        delay: Math.min(index, 8) * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const totalStudents = stats?.totalStudents ?? 0;
  const presentStudents = stats?.presentCount ?? 0;
  const absentStudents = stats?.absentCount ?? 0;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}, {scale: scaleAnim}],
        },
      ]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(classroom)}
        android_ripple={{color: 'rgba(99, 102, 241, 0.08)'}}
        style={styles.cardPressable}>
        <View style={styles.card}>
          {/* ── Card Header (Batch Name + Time Row below it) ── */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <View style={styles.iconBox}>
                <Users size={18} color="#6366F1" strokeWidth={2.2} />
              </View>
              <View style={styles.batchInfo}>
                <Text style={styles.batchName} numberOfLines={1}>
                  {classroom.batchName}
                </Text>

                {/* ── Time Row Relocated Directly Below Batch Name ── */}
                <View style={styles.timeRow}>
                  <Clock size={12} color="#6366F1" strokeWidth={2.2} />
                  <Text style={styles.timeText} numberOfLines={1}>
                    {formatTime(classroom.batchStartTime)} -{' '}
                    {formatTime(classroom.batchEndTime)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{classroom.academicYear}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Course & Medium Row ── */}
          <View style={styles.courseRow}>
            <View style={styles.courseItem}>
              <Text style={styles.courseLabel}>Course</Text>
              <Text style={styles.courseValue} numberOfLines={1}>
                {classroom.course?.coursename || 'N/A'}
              </Text>
            </View>
            <View style={styles.courseItem}>
              <Text style={styles.courseLabel}>Medium</Text>
              <Text style={styles.courseValue} numberOfLines={1}>
                {classroom.medium?.mediumName || 'N/A'}
              </Text>
            </View>
          </View>

          {/* ── Stats Row ── */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{totalStudents}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Present</Text>
              <Text style={[styles.statValue, {color: '#10B981'}]}>
                {presentStudents}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Absent</Text>
              <Text style={[styles.statValue, {color: '#EF4444'}]}>
                {absentStudents}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── Main Screen Component ────────────────────────────────────────────────────
const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [error, setError] = useState(null);

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All Academic Years');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const [dropdownOpacity] = useState(new Animated.Value(0));
  const [dropdownHeight] = useState(new Animated.Value(0));
  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
  });
  const dropdownRef = useRef(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const {userData} = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const years = ['All Academic Years'];
    for (let y = 2020; y <= 2030; y++) years.push(`${y}-${y + 1}`);
    setAcademicYears(years);

    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const fetchData = useCallback(async () => {
    if (!userData?.email) return;
    try {
      setError(null);
      const rooms = await fetchClassroomByTeacher(userData.email);
      setClassrooms(rooms || []);

      const attMap = {};
      for (const room of rooms || []) {
        try {
          const res = await fetchAttendanceDataByTeacher({
            classroomId: room.id,
            branchCode: room.branchCode,
          });
          attMap[room.id] = {
            totalStudents: res?.totalStudents ?? 0,
            presentCount: res?.presentCount ?? 0,
            absentCount: res?.absentCount ?? 0,
          };
        } catch {
          attMap[room.id] = {
            totalStudents: 0,
            presentCount: 0,
            absentCount: 0,
          };
        }
      }
      setAttendanceMap(attMap);
    } catch (err) {
      console.error('Error loading classrooms:', err);
      setError(`Error: ${err.message || 'Something went wrong'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const openDropdown = () => {
    if (!dropdownRef.current) return;
    dropdownRef.current.measure((x, y, w, heightEl, pageX, pageY) => {
      const maxVisibleItems = 4;
      const itemHeight = 44;
      const calcHeight = Math.min(
        academicYears.length * itemHeight,
        maxVisibleItems * itemHeight,
      );
      setDropdownPosition({
        x: 10,
        y: pageY + heightEl + 4,
        width: screenWidth - 20,
      });
      setShouldRenderDropdown(true);
      dropdownHeight.setValue(0);
      dropdownOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: calcHeight,
          duration: 220,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(dropdownHeight, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: false,
      }),
    ]).start(() => setShouldRenderDropdown(false));
  };

  const handleSelectYear = year => {
    setSelectedYear(year);
    closeDropdown();
    setDropdownOpen(false);
  };

  const handleCardPress = useCallback(
    classroom => {
      navigation.navigate('AttendanceFilter', {
        classroomId: classroom.id,
        branchCode: classroom.branchCode,
        batchName: classroom.batchName,
      });
    },
    [navigation],
  );

  const filteredClassrooms = useMemo(
    () =>
      classrooms.filter(
        c =>
          selectedYear === 'All Academic Years' ||
          c.academicYear === selectedYear,
      ),
    [classrooms, selectedYear],
  );

  // ── FlatList Handlers ──
  const renderItem = useCallback(
    ({item, index}) => (
      <AttendanceCard
        classroom={item}
        stats={attendanceMap[item.id]}
        index={index}
        onPress={handleCardPress}
      />
    ),
    [attendanceMap, handleCardPress],
  );

  const keyExtractor = useCallback(
    item => item.id?.toString() || item.batchName,
    [],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <>
        {/* Academic Year Selector */}
        <View style={styles.dropdownContainer}>
          <Pressable
            ref={dropdownRef}
            style={styles.customPicker}
            onPress={() => {
              if (isDropdownOpen) {
                closeDropdown();
                setDropdownOpen(false);
              } else {
                openDropdown();
                setDropdownOpen(true);
              }
            }}>
            <Text style={styles.selectedValue}>{selectedYear}</Text>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#64748B"
            />
          </Pressable>

          {shouldRenderDropdown && (
            <Modal transparent visible={shouldRenderDropdown}>
              <Pressable
                style={styles.modalOverlay}
                onPress={() => {
                  closeDropdown();
                  setDropdownOpen(false);
                }}>
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      position: 'absolute',
                      top: dropdownPosition.y,
                      left: dropdownPosition.x,
                      width: dropdownPosition.width,
                      height: dropdownHeight,
                      opacity: dropdownOpacity,
                    },
                  ]}>
                  <FlatList
                    data={academicYears}
                    keyExtractor={item => item}
                    renderItem={({item}) => (
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => handleSelectYear(item)}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedYear === item &&
                              styles.dropdownItemTextActive,
                          ]}>
                          {item}
                        </Text>
                      </Pressable>
                    )}
                  />
                </Animated.View>
              </Pressable>
            </Modal>
          )}
        </View>

        {/* Counter Header */}
        <Text style={styles.resultCount}>
          {filteredClassrooms.length} Batch
          {filteredClassrooms.length !== 1 ? 'es' : ''} Available
        </Text>
      </>
    ),
    [
      selectedYear,
      isDropdownOpen,
      shouldRenderDropdown,
      dropdownPosition,
      dropdownHeight,
      dropdownOpacity,
      academicYears,
      filteredClassrooms.length,
    ],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconBox}>
          <Users size={32} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>No Batches Found</Text>
        <Text style={styles.emptySubtitle}>
          No active classroom batches match the selected academic year.
        </Text>
      </View>
    ),
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TeacherHeader />
        <View style={styles.fullScreenState}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
        <TeacherFooter />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TeacherHeader />
        <View style={styles.fullScreenState}>
          <AlertCircle size={44} color="#EF4444" strokeWidth={2} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
        <TeacherFooter />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

      {/* Professional Header Bar */}
      <Animated.View
        style={[
          styles.pageHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.pageTitle}>Attendance</Text>
        <Text style={styles.pageSubtitle}>
          Track student attendance records across active batches
        </Text>
      </Animated.View>

      <FlatList
        data={filteredClassrooms}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6366F1']}
          />
        }
      />

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default Attendance;

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── States
  fullScreenState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Page Header Bar
  pageHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // ── Scroll/List Content
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 24,
  },
  resultCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Filter Dropdown
  dropdownContainer: {
    marginBottom: 12,
  },
  customPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  selectedValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },

  // ── Card Design
  cardWrapper: {
    marginBottom: 12,
  },
  cardPressable: {
    borderRadius: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  // ── Relocated Time Row Style
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  yearBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },

  // ── Course Row
  courseRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  courseItem: {
    flex: 1,
  },
  courseLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  courseValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  // ── Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },

  // ── Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
