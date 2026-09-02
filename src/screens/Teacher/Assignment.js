import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {useAuth} from '../../auth/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {fetchClassroomByTeacher} from '../../util/Apicall';

const {width: screenWidth} = Dimensions.get('window');

// ── Helpers ──
const formatTime = timeStr => {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

// ── Compact Assignment Card ──
const AssignmentCard = ({classroom, index, onManagePress}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const courseName = classroom.course?.coursename || 'N/A';
  const mediumName = classroom.medium?.mediumName || 'N/A';
  const timeRange = `${formatTime(classroom.batchStartTime)} - ${formatTime(
    classroom.batchEndTime,
  )}`;
  const subjects = Array.isArray(classroom.subjects) ? classroom.subjects : [];

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}, {scale: scaleAnim}],
        },
      ]}>
      {/* ── Header Row ── */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Icon name="assignment" size={20} color="#4f46e5" />
          </View>
          <View style={styles.batchInfo}>
            <Text style={styles.batchName} numberOfLines={1}>
              {classroom.batchName}
            </Text>
          </View>
          {/* Year Badge pinned to the Right */}
          <View style={styles.yearBadge}>
            <Text style={styles.yearBadgeText}>
              {classroom.academicYear || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Compact 2x2 Data Grid ── */}
      <View style={styles.compactGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Course</Text>
          <Text style={styles.gridValue} numberOfLines={1}>
            {courseName}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Medium</Text>
          <Text style={styles.gridValue} numberOfLines={1}>
            {mediumName}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Timings</Text>
          <Text style={styles.gridValue} numberOfLines={1}>
            {timeRange}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Subjects</Text>
          <View style={styles.subjectsContainer}>
            {subjects.length > 0 ? (
              subjects.slice(0, 2).map((sub, idx) => (
                <View key={idx} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText} numberOfLines={1}>
                    {sub.subjectName}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.gridValue}>None</Text>
            )}
            {subjects.length > 2 && (
              <View style={[styles.subjectChip, styles.moreChip]}>
                <Text style={styles.moreChipText}>+{subjects.length - 2}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Footer Action Button ── */}
      <TouchableOpacity
        style={styles.manageBtn}
        activeOpacity={0.7}
        onPress={() => onManagePress(classroom)}>
        <Text style={styles.manageBtnText}>Manage Assignments</Text>
        <Icon name="arrow-forward" size={16} color="#4f46e5" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main Screen Component ──
const Assignment = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [error, setError] = useState(null);

  // Academic Year State
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
  const {userData} = useAuth();
  const navigation = useNavigation();

  // Dynamic Year List Generation
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = ['All Academic Years'];
    for (let y = currentYear - 3; y <= currentYear + 3; y++) {
      years.push(`${y}-${y + 1}`);
    }
    setAcademicYears(years);
  }, []);

  // Fetch Classrooms Data
  const loadClassrooms = useCallback(
    async (isRefresh = false) => {
      if (!userData?.email) return;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const rooms = await fetchClassroomByTeacher(userData.email);
        setClassrooms(Array.isArray(rooms) ? rooms : []);
      } catch (err) {
        console.error('Error loading classrooms:', err);
        setError(`Error: ${err.message || 'Something went wrong'}`);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userData?.email],
  );

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  // Dropdown Handlers
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
        x: 14,
        y: pageY + heightEl + 4,
        width: screenWidth - 28,
      });
      setShouldRenderDropdown(true);
      dropdownHeight.setValue(0);
      dropdownOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: calcHeight,
          duration: 200,
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
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => setShouldRenderDropdown(false));
  };

  const handleSelectYear = year => {
    setSelectedYear(year);
    closeDropdown();
    setDropdownOpen(false);
  };

  const handleManagePress = classroom => {
    navigation.navigate('SubmitAssignment', {
      classroomId: classroom.id,
      branchCode: classroom.branchCode,
      batchName: classroom.batchName,
    });
  };

  const filteredClassrooms = classrooms.filter(
    c =>
      selectedYear === 'All Academic Years' || c.academicYear === selectedYear,
  );

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

      {/* Screen Title Bar */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Assignments</Text>
          <Text style={styles.screenSubtitle}>
            Manage and track student assignments
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {filteredClassrooms.length} Batches
          </Text>
        </View>
      </View>

      {/* Dropdown Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          ref={dropdownRef}
          style={styles.pickerButton}
          activeOpacity={0.8}
          onPress={() => {
            if (isDropdownOpen) {
              closeDropdown();
              setDropdownOpen(false);
            } else {
              openDropdown();
              setDropdownOpen(true);
            }
          }}>
          <Icon
            name="filter-list"
            size={18}
            color="#475569"
            style={{marginRight: 6}}
          />
          <Text style={styles.pickerText}>{selectedYear}</Text>
          <Icon
            name={isDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={20}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>

      {/* Modal Dropdown Container */}
      {shouldRenderDropdown && (
        <Modal transparent visible={shouldRenderDropdown} animationType="none">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              closeDropdown();
              setDropdownOpen(false);
            }}>
            <Animated.View
              style={[
                styles.modalDropdown,
                {
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
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleSelectYear(item)}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        item === selectedYear && styles.selectedDropdownText,
                      ]}>
                      {item}
                    </Text>
                    {item === selectedYear && (
                      <Icon name="check" size={16} color="#4f46e5" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Content Area Handling */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Icon name="error-outline" size={44} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadClassrooms()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredClassrooms.length === 0 ? (
        <View style={styles.centeredState}>
          <Icon name="folder-off" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            No batches found for selected year.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredClassrooms}
          keyExtractor={item => item.id?.toString()}
          renderItem={({item, index}) => (
            <AssignmentCard
              classroom={item}
              index={index}
              onManagePress={handleManagePress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadClassrooms(true)}
              colors={['#4f46e5']}
              tintColor="#4f46e5"
            />
          }
        />
      )}

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default Assignment;

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  screenSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    color: '#4338ca',
    fontSize: 11,
    fontWeight: '700',
  },
  filterBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pickerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  batchInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '70%',
  },
  yearBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yearBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  gridItem: {
    width: '48%',
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginTop: 1,
  },
  subjectsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  subjectChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  subjectChipText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4338ca',
  },
  moreChip: {
    backgroundColor: '#cbd5e1',
  },
  moreChipText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#334155',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ee2e8f0' === '' ? '' : '#f8fafc',
    borderRadius: 8,
    paddingVertical: 7,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  modalDropdown: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  selectedDropdownText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
});
