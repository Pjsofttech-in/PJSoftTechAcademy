import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Animated,
  Pressable,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Search,
  User,
  Clock,
  LogIn,
  LogOut,
  UserCheck,
  UserX,
  Users,
  ChevronDown,
} from 'lucide-react-native';

import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {
  fetchAttendanceDataByTeacher,
  submitManualLogout,
} from '../../util/Apicall';

const {width: screenWidth} = Dimensions.get('window');

// ─── Static Options ─────────────────────────────────────────────────────────

const TIME_OPTIONS = [
  {label: 'Today', value: 'today'},
  {label: '7 Days', value: '7days'},
  {label: '30 Days', value: '30days'},
  {label: '365 Days', value: '365days'},
  {label: 'Custom', value: 'custom'},
];

const STATUS_OPTIONS = [
  {label: 'All Students', value: 'all'},
  {label: 'Present', value: 'present'},
  {label: 'Absent', value: 'absent'},
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const getLoginStatusStyle = status => {
  const s = (status || '').toLowerCase();
  if (s === 'present' || s === 'login' || s === 'on time') {
    return {bg: '#E6F4EA', color: '#1E7F43', dot: '#34A853'};
  }
  if (s === 'absent' || s === 'logout') {
    return {bg: '#FDECEC', color: '#B42318', dot: '#EF4444'};
  }
  if (s === 'late') {
    return {bg: '#FFF8E1', color: '#B45309', dot: '#FBC02D'};
  }
  return {bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8'};
};

const formatDate = dateString => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// ─── Space-Saving Count Card Component ───────────────────────────────────────

const CountCard = React.memo(({title, count, iconName, bgColor, iconColor}) => {
  const renderIcon = () => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck size={14} color={iconColor} strokeWidth={2.2} />;
      case 'UserX':
        return <UserX size={14} color={iconColor} strokeWidth={2.2} />;
      case 'Users':
        return <Users size={14} color={iconColor} strokeWidth={2.2} />;
      case 'Clock':
        return <Clock size={14} color={iconColor} strokeWidth={2.2} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.countCard}>
      <View style={[styles.countIconBox, {backgroundColor: bgColor}]}>
        {renderIcon()}
      </View>
      <View style={styles.countTextWrap}>
        <Text style={styles.countTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.countNumber}>{count ?? 0}</Text>
      </View>
    </View>
  );
});

// ─── Student Card Component ───────────────────────────────────────────────────

const StudentCard = React.memo(({item, onLogout}) => {
  const statusStyle = getLoginStatusStyle(item.loginStatus);
  const [pressed, setPressed] = useState(false);
  const alreadyLoggedOut = !!item.logoutTime;

  return (
    <View style={styles.studentCard}>
      <View style={styles.studentCardHeader}>
        <View style={styles.avatarCircle}>
          <User size={18} color="#6366F1" strokeWidth={2.2} />
        </View>
        <View style={styles.studentNameWrap}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.studentName || 'N/A'}
          </Text>
          <View style={styles.rollNoRow}>
            <Text style={styles.rollNoText}>
              Roll No: {item.rollno || 'N/A'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: statusStyle.bg}]}>
          <View
            style={[styles.statusDot, {backgroundColor: statusStyle.dot}]}
          />
          <Text style={[styles.statusText, {color: statusStyle.color}]}>
            {item.loginStatus || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <Clock size={11} color="#64748B" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Date</Text>
          </View>
          <Text style={styles.infoCellValue}>{formatDate(item.date)}</Text>
        </View>

        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <LogIn size={11} color="#10B981" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Login Time</Text>
          </View>
          <Text style={styles.infoCellValue}>
            {item.loginTime ? item.loginTime.slice(0, 5) : '--'}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <LogOut size={11} color="#EF4444" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Logout Time</Text>
          </View>
          <Text style={styles.infoCellValue}>
            {item.logoutTime ? item.logoutTime.slice(0, 5) : '--'}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <UserCheck size={11} color="#6366F1" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Status</Text>
          </View>
          <Text style={[styles.infoCellValue, {color: statusStyle.color}]}>
            {item.loginStatus || '--'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.logoutRow}>
        {alreadyLoggedOut ? (
          <View style={styles.loggedOutChip}>
            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
            <Text style={styles.loggedOutChipText}>Logged Out</Text>
          </View>
        ) : (
          <Pressable
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onPress={() => onLogout(item.rollno)}
            style={[
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}>
            <View
              style={[
                styles.logoutButtonInner,
                pressed && styles.logoutButtonInnerPressed,
              ]}>
              <LogOut
                size={13}
                color={pressed ? '#475569' : '#FFFFFF'}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.logoutButtonText,
                  pressed && styles.logoutButtonTextPressed,
                ]}>
                Logout
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
});

// ─── Main Screen Component ────────────────────────────────────────────────────

const AttendanceFilter = ({route}) => {
  const {classroomId, branchCode} = route.params || {};

  const timeRef = useRef(null);
  const statusRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [timeRange, setTimeRange] = useState(TIME_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownType, setDropdownType] = useState(null);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const timeModalHeight = useRef(null);
  if (!timeModalHeight.current) timeModalHeight.current = new Animated.Value(0);

  const statusModalHeight = useRef(null);
  if (!statusModalHeight.current)
    statusModalHeight.current = new Animated.Value(0);

  const timeDropdownOpacity = useRef(null);
  if (!timeDropdownOpacity.current)
    timeDropdownOpacity.current = new Animated.Value(0);

  const statusDropdownOpacity = useRef(null);
  if (!statusDropdownOpacity.current)
    statusDropdownOpacity.current = new Animated.Value(0);

  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
  });

  // ── Data Fetching ──
  const loadData = useCallback(async () => {
    if (!classroomId || !branchCode) return;
    try {
      setLoading(true);
      const res = await fetchAttendanceDataByTeacher({
        classroomId,
        branchCode,
        filter: timeRange.value,
        status: statusFilter.value,
      });
      setAttendanceData(res);
    } catch (e) {
      console.error('Failed to load attendance:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classroomId, branchCode, timeRange.value, statusFilter.value]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleManualLogout = useCallback(
    async rollno => {
      try {
        const response = await submitManualLogout({
          classroomId,
          branchCode,
          studentIds: [rollno],
        });
        Alert.alert('Success', response?.message || 'Logout successful');
        loadData();
      } catch (error) {
        Alert.alert('Error', error?.message || 'Logout failed');
      }
    },
    [classroomId, branchCode, loadData],
  );

  // ── Dropdown Controls ──
  const openDropdown = useCallback(type => {
    const ref = type === 'time' ? timeRef : statusRef;
    const options = type === 'time' ? TIME_OPTIONS : STATUS_OPTIONS;
    const itemHeight = 46;
    const calculatedHeight = options.length * itemHeight;
    const modalHeight =
      type === 'time' ? timeModalHeight.current : statusModalHeight.current;
    const dropdownOpacity =
      type === 'time'
        ? timeDropdownOpacity.current
        : statusDropdownOpacity.current;

    if (!ref.current) return;

    ref.current.measure((x, y, width, heightEl, pageX, pageY) => {
      setDropdownPosition({
        x: pageX,
        y: pageY + heightEl + 4,
        width: Math.max(width, 150),
      });
      setDropdownType(type);
      setShouldRenderDropdown(true);

      const otherModalHeight =
        type === 'time' ? statusModalHeight.current : timeModalHeight.current;
      const otherOpacity =
        type === 'time'
          ? statusDropdownOpacity.current
          : timeDropdownOpacity.current;
      otherModalHeight.setValue(0);
      otherOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(modalHeight, {
          toValue: calculatedHeight,
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
  }, []);

  const closeDropdown = useCallback(() => {
    const modalHeight =
      dropdownType === 'time'
        ? timeModalHeight.current
        : statusModalHeight.current;
    const dropdownOpacity =
      dropdownType === 'time'
        ? timeDropdownOpacity.current
        : statusDropdownOpacity.current;

    if (!modalHeight || !dropdownOpacity) return;

    Animated.parallel([
      Animated.timing(modalHeight, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShouldRenderDropdown(false);
      setDropdownType(null);
    });
  }, [dropdownType]);

  const handleSelect = useCallback(
    option => {
      if (dropdownType === 'time') setTimeRange(option);
      else setStatusFilter(option);
      closeDropdown();
    },
    [dropdownType, closeDropdown],
  );

  const currentModalHeight =
    dropdownType === 'time'
      ? timeModalHeight.current
      : statusModalHeight.current;
  const currentDropdownOpacity =
    dropdownType === 'time'
      ? timeDropdownOpacity.current
      : statusDropdownOpacity.current;

  // ── Data Computations ──
  const allRows = useMemo(() => {
    if (!attendanceData) return [];
    if (statusFilter.value === 'present')
      return attendanceData.presentData || [];
    if (statusFilter.value === 'absent') return attendanceData.absentData || [];
    return [
      ...(attendanceData.presentData || []),
      ...(attendanceData.absentData || []),
    ];
  }, [attendanceData, statusFilter.value]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return allRows;
    const query = searchQuery.toLowerCase();
    return allRows.filter(
      s =>
        s.studentName?.toLowerCase().includes(query) ||
        String(s.rollno || '').includes(query),
    );
  }, [allRows, searchQuery]);

  const attendancePercent = useMemo(() => {
    if (attendanceData?.totalStudents > 0) {
      return `${Math.round(
        (attendanceData.presentCount / attendanceData.totalStudents) * 100,
      )}%`;
    }
    return '0%';
  }, [attendanceData]);

  const renderItem = useCallback(
    ({item}) => <StudentCard item={item} onLogout={handleManualLogout} />,
    [handleManualLogout],
  );

  const keyExtractor = useCallback(
    (item, index) => (item.rollno ? String(item.rollno) : String(index)),
    [],
  );

  // ── List Header ──
  const ListHeaderComponent = useMemo(
    () => (
      <>
        {/* Top Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchInputBox}>
            <Search size={16} color="#94A3B8" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or roll no..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Compact 4-Card Grid */}
        <View style={styles.cardsContainer}>
          <CountCard
            title="Present"
            count={attendanceData?.presentCount}
            iconName="UserCheck"
            bgColor="#EEF2FF"
            iconColor="#10B981"
          />
          <CountCard
            title="Absent"
            count={attendanceData?.absentCount}
            iconName="UserX"
            bgColor="#FEF2F2"
            iconColor="#EF4444"
          />
          <CountCard
            title="Total"
            count={attendanceData?.totalStudents}
            iconName="Users"
            bgColor="#EEF2FF"
            iconColor="#6366F1"
          />
          <CountCard
            title="Attendance"
            count={attendancePercent}
            iconName="Clock"
            bgColor="#FFF7ED"
            iconColor="#F59E0B"
          />
        </View>

        {/* Filters Row */}
        <View style={styles.filtersRow}>
          <View style={styles.dropdownWrap}>
            <Text style={styles.dropdownTitle}>Time Range</Text>
            <Pressable
              ref={timeRef}
              style={styles.customPicker}
              onPress={() => openDropdown('time')}>
              <Text style={styles.selectedValue}>{timeRange.label}</Text>
              <ChevronDown size={14} color="#64748B" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.dropdownWrap}>
            <Text style={styles.dropdownTitle}>Status</Text>
            <Pressable
              ref={statusRef}
              style={styles.customPicker}
              onPress={() => openDropdown('status')}>
              <Text style={styles.selectedValue}>{statusFilter.label}</Text>
              <ChevronDown size={14} color="#64748B" strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* Results Counter */}
        <Text style={styles.listLabel}>
          {filteredRows.length} Student{filteredRows.length !== 1 ? 's' : ''}
        </Text>
      </>
    ),
    [
      attendanceData,
      attendancePercent,
      searchQuery,
      timeRange.label,
      statusFilter.label,
      openDropdown,
      filteredRows.length,
    ],
  );

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRows}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366F1']}
            />
          }
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Users size={36} color="#94A3B8" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          }
        />
      )}

      {/* Animated Dropdown Modal */}
      {shouldRenderDropdown && (
        <Modal
          transparent
          visible
          animationType="none"
          onRequestClose={closeDropdown}>
          <Pressable style={styles.modalOverlay} onPress={closeDropdown}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  height: currentModalHeight,
                  opacity: currentDropdownOpacity,
                  position: 'absolute',
                  top: dropdownPosition.y,
                  left: dropdownPosition.x,
                  width: dropdownPosition.width,
                },
              ]}>
              {(dropdownType === 'time' ? TIME_OPTIONS : STATUS_OPTIONS).map(
                op => (
                  <Pressable
                    key={op.value}
                    style={({pressed}) => [
                      styles.dropdownItem,
                      pressed && styles.dropdownItemPressed,
                    ]}
                    onPress={() => handleSelect(op)}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        (dropdownType === 'time'
                          ? timeRange.value === op.value
                          : statusFilter.value === op.value) &&
                          styles.dropdownItemTextActive,
                      ]}>
                      {op.label}
                    </Text>
                  </Pressable>
                ),
              )}
            </Animated.View>
          </Pressable>
        </Modal>
      )}

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default AttendanceFilter;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  listContent: {
    paddingBottom: 24,
  },

  // ── Top Search Bar
  searchWrapper: {
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },

  // ── Compact 4-Card Grid
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  countCard: {
    width: (screenWidth - 26) / 2 - 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countTextWrap: {
    flex: 1,
  },
  countTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  countNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  countIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Filters Row
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 10,
  },
  dropdownWrap: {
    flex: 1,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  customPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  listLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },

  // ── Student Card
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentNameWrap: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rollNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  rollNoText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoCell: {
    width: '50%',
    paddingVertical: 4,
  },
  infoCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  infoCellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoCellValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  logoutRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  logoutButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutButtonInnerPressed: {
    backgroundColor: '#E2E8F0',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButtonTextPressed: {
    color: '#475569',
  },
  loggedOutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4EA',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  loggedOutChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E7F43',
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
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
  dropdownItemPressed: {
    backgroundColor: '#F8FAFC',
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
});
