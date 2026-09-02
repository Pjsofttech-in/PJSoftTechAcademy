import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchAttendanceCountByFormId} from '../../util/Apicall';
import StudentHeader from '../../components/StudentComponent/StudentHeader';
import StudentFooter from '../../components/StudentComponent/StudentFooter';

// ─── Constants & Helpers ───────────────────────────────────────────────────
const BRAND_COLOR = '#6495ED';

const formatDateObj = dateString => {
  if (!dateString) return {day: '--', month: '---'};
  const date = new Date(dateString);
  if (isNaN(date)) return {day: '--', month: '---'};
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', {month: 'short'}).toUpperCase();
  return {day, month};
};

const formatTime12h = timeStr => {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length < 2) return '--:--';
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h < 10 ? '0' : ''}${h}:${m} ${ampm}`;
};

// ─── Dense Attendance Row Component ─────────────────────────────────────────
const AttendanceRow = React.memo(({item}) => {
  const statusLower = (item.loginStatus || '').toLowerCase();
  const isPresent = statusLower === 'present' || statusLower === 'on time';
  const {day, month} = formatDateObj(item.date);
  const login = formatTime12h(item.loginTime);
  const logout = formatTime12h(item.logoutTime);

  return (
    <View style={[styles.rowContainer, !isPresent && styles.rowContainerOff]}>
      {/* Accent Line */}
      <View style={[styles.accentBar, !isPresent && styles.accentBarOff]} />

      {/* Date Stack */}
      <View style={styles.dateBlock}>
        <Text style={[styles.dateDay, !isPresent && styles.textMuted]}>
          {day}
        </Text>
        <Text style={[styles.dateMonth, !isPresent && styles.textSubtle]}>
          {month}
        </Text>
      </View>

      {/* Status Indicator */}
      <View
        style={[
          styles.statusDot,
          isPresent ? styles.dotPresent : styles.dotAbsent,
        ]}
      />

      {/* Student Info Stack */}
      <View style={styles.infoContainer}>
        <Text
          numberOfLines={1}
          style={[styles.studentName, !isPresent && styles.textMuted]}>
          {item.studentName || 'N/A'}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.rollText, !isPresent && styles.textSubtle]}>
          RN: {item.rollno || 'N/A'} • {item.loginStatus || 'N/A'}
        </Text>
      </View>

      {/* Time Stack */}
      <View style={styles.timeStack}>
        <Text style={[styles.timeText, !isPresent && styles.textSubtle]}>
          In: {login}
        </Text>
        <Text style={[styles.timeText, !isPresent && styles.textSubtle]}>
          Out: {logout}
        </Text>
      </View>
    </View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const Attendance = () => {
  const route = useRoute();
  const [studentData, setStudentData] = useState(
    route.params?.studentData || null,
  );
  const [attendanceData, setAttendanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const timeOptions = useMemo(
    () => [
      {label: 'Today', value: 'today'},
      {label: '7 Days', value: '7days'},
      {label: 'Custom', value: 'custom'},
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      {label: 'All', value: 'all'},
      {label: 'Present', value: 'present'},
      {label: 'Absent', value: 'absent'},
    ],
    [],
  );

  const [timeRange, setTimeRange] = useState(timeOptions[0]);
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    if (!studentData) {
      AsyncStorage.getItem('studentData')
        .then(d => d && setStudentData(JSON.parse(d)))
        .catch(e => console.error('Error loading studentData', e));
    }
  }, [studentData]);

  const fetchData = useCallback(
    async (filterKey, customFrom = null, customTo = null) => {
      if (
        !studentData?.formId ||
        !studentData?.admissionId ||
        !studentData?.branchCode
      )
        return;
      setIsLoading(true);
      try {
        const response = await fetchAttendanceCountByFormId({
          formId: studentData.formId,
          admissionId: studentData.admissionId,
          filter: filterKey,
          branchCode: studentData.branchCode,
          fromDate: customFrom,
          toDate: customTo,
        });
        setAttendanceData(response);
      } catch (err) {
        setAttendanceData(null);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [studentData?.formId, studentData?.admissionId, studentData?.branchCode],
  );

  useEffect(() => {
    if (studentData && timeRange.value !== 'custom') {
      fetchData(timeRange.value);
    }
  }, [studentData, timeRange, fetchData]);

  // ── Refresh event updates states back to default (Today & All) ──
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeRange(timeOptions[0]); // Reset to "Today"
    setStatusFilter(statusOptions[0]); // Reset to "All"
    setSearchQuery(''); // Clear search query
    fetchData(timeOptions[0].value);
  }, [timeOptions, statusOptions, fetchData]);

  const onFromDateChange = (event, selected) => {
    setShowFromPicker(false);
    if (selected) {
      setFromDate(selected);
      setShowToPicker(true);
    }
  };

  const onToDateChange = (event, selected) => {
    setShowToPicker(false);
    if (selected) {
      setToDate(selected);
      fetchData(
        'custom',
        fromDate.toISOString().split('T')[0],
        selected.toISOString().split('T')[0],
      );
    }
  };

  const allRows = useMemo(() => {
    if (!attendanceData) return [];
    if (statusFilter.value === 'present')
      return attendanceData.presentData || [];
    if (statusFilter.value === 'absent') return attendanceData.absentData || [];
    return [
      ...(attendanceData.presentData || []),
      ...(attendanceData.absentData || []),
    ];
  }, [attendanceData, statusFilter]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return allRows;
    const query = searchQuery.toLowerCase();
    return allRows.filter(
      s =>
        s.studentName?.toLowerCase().includes(query) ||
        String(s.rollno || '').includes(query),
    );
  }, [allRows, searchQuery]);

  const presentCount = attendanceData?.presentCount ?? 0;
  const absentCount = attendanceData?.absentCount ?? 0;
  const total = presentCount + absentCount;

  const renderItem = useCallback(({item}) => <AttendanceRow item={item} />, []);
  const keyExtractor = useCallback(
    (item, index) => item.id?.toString() || index.toString(),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StudentHeader />

      {/* Header & Controls */}
      <View style={styles.topSection}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Attendance</Text>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={isLoading}
            style={styles.refreshBtn}
            activeOpacity={0.7}>
            <Ionicons
              name="refresh-outline"
              size={18}
              color={isLoading ? '#94A3B8' : BRAND_COLOR}
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or roll no..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle-outline" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Strip */}
        {!isLoading && attendanceData && (
          <View style={styles.statsBar}>
            <Text style={styles.statText}>
              Present: <Text style={styles.statValue}>{presentCount}</Text>
            </Text>
            <Text style={styles.statDivider}>|</Text>
            <Text style={styles.statText}>
              Absent: <Text style={styles.statValue}>{absentCount}</Text>
            </Text>
            <Text style={styles.statDivider}>|</Text>
            <Text style={styles.statText}>
              Total: <Text style={styles.statValue}>{total}</Text>
            </Text>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filtersRow}>
          <View style={styles.chipGroup}>
            {timeOptions.map(opt => {
              const active = opt.value === timeRange.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setTimeRange(opt);
                    if (opt.value === 'custom') setShowFromPicker(true);
                  }}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.7}>
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.chipGroup}>
            {statusOptions.map(opt => {
              const active = opt.value === statusFilter.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setStatusFilter(opt)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.7}>
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Main Content Body */}
      <View style={styles.contentBody}>
        {isLoading ? (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color={BRAND_COLOR} />
            <Text style={styles.loadingText}>Fetching records...</Text>
          </View>
        ) : filteredRows.length === 0 ? (
          <View style={styles.centeredBox}>
            <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No records found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRows}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[BRAND_COLOR]}
                tintColor={BRAND_COLOR}
              />
            }
          />
        )}
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={onFromDateChange}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={onToDateChange}
        />
      )}

      <StudentFooter />
    </SafeAreaView>
  );
};

export default Attendance;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSection: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: 'Poppins-SemiBold',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    padding: 0,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#EEF4FF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  statText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'Poppins-Medium',
  },
  statValue: {
    color: BRAND_COLOR,
    fontFamily: 'Poppins-SemiBold',
  },
  statDivider: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    padding: 2,
    flex: 1,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  filterChipActive: {
    backgroundColor: BRAND_COLOR,
  },
  chipText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Poppins-SemiBold',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  contentBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  listContent: {
    paddingVertical: 0,
  },
  rowContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingRight: 12,
  },
  accentBar: {
    width: 3,
    height: '100%',
    backgroundColor: BRAND_COLOR,
    marginRight: 8,
  },
  dateBlock: {
    width: 32,
    alignItems: 'center',
    marginRight: 6,
  },
  dateDay: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: 'Poppins-Bold',
    lineHeight: 16,
  },
  dateMonth: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 11,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  dotPresent: {
    backgroundColor: BRAND_COLOR,
  },
  dotAbsent: {
    backgroundColor: '#CBD5E1',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 12,
    color: '#1E293B',
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 16,
  },
  rollText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Poppins-Regular',
    lineHeight: 14,
  },
  timeStack: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Poppins-Regular',
    lineHeight: 13,
  },
  rowContainerOff: {
    backgroundColor: '#F8FAFC',
  },
  accentBarOff: {
    backgroundColor: '#CBD5E1',
  },
  textMuted: {
    color: '#64748B',
  },
  textSubtle: {
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 15,
  },
  centeredBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins-Medium',
  },
  emptyTitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins-Medium',
  },
});
