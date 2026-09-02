import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchTimetableByClassRoomId} from '../../util/Apicall';
import StudentHeader from '../../components/StudentComponent/StudentHeader';
import StudentFooter from '../../components/StudentComponent/StudentFooter';

// ─── Constants & Helpers ───────────────────────────────────────────────────
const BRAND_COLOR = '#6495ED';

const WEEKDAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_SHORT = {
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT',
  Sunday: 'SUN',
};

const resolveClassRoomId = data => {
  if (!data) return null;
  return (
    data.classRoomId ||
    data.classroomId ||
    data.classRoom?.id ||
    data.classroom?.id ||
    data.admissionClassRoom?.id ||
    data.admissionClassRoom?.classRoomId ||
    data.admissionClassRoom?.classroom?.id ||
    data.classRoom?.classroom?.id ||
    data.admission?.classRoom?.id ||
    data.enrolment?.classRoom?.id ||
    null
  );
};

const processAssignments = (assignments = []) => {
  const unique = assignments.filter(
    (a, i, arr) => arr.findIndex(b => b.period?.id === a.period?.id) === i,
  );
  return [...unique].sort(
    (a, b) => (a.period?.periodNo ?? 0) - (b.period?.periodNo ?? 0),
  );
};

// Formats "08:30" → "08:30 AM"
const formatTime = time => {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h < 10 ? '0' : ''}${h}:${m} ${ampm}`;
};

// ─── Dense Stacked Period Row ──────────────────────────────────────────────
const PeriodRow = React.memo(({item}) => {
  const subject = item.subject?.subjectName || '—';
  const teacher = item.teacher?.teacherName || '—';
  const periodNo = item.period?.periodNo ?? '';
  const startTime = formatTime(item.period?.startTime);
  const endTime = formatTime(item.period?.endTime);
  const isOn = item.status === 'ON';

  return (
    <View style={[styles.periodRow, !isOn && styles.periodRowOff]}>
      {/* Accent Indicator */}
      <View style={[styles.accentBar, !isOn && styles.accentBarOff]} />

      {/* Middle Stack: Subject above Teacher */}
      <View style={styles.infoContainer}>
        <Text
          numberOfLines={1}
          style={[styles.subjectText, !isOn && styles.textOff]}>
          {subject}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.teacherText, !isOn && styles.textOffSecondary]}>
          {teacher}
        </Text>
      </View>

      {/* Right Column: Period Number & Stacked Times */}
      <View style={styles.metaContainer}>
        <Text style={[styles.periodNumber, !isOn && styles.periodNumberOff]}>
          {periodNo}
        </Text>
        <View style={styles.timeStack}>
          <Text style={[styles.timeText, !isOn && styles.textOffSecondary]}>
            {startTime}
          </Text>
          <Text style={[styles.timeText, !isOn && styles.textOffSecondary]}>
            {endTime}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ─── Main Timetable Screen ──────────────────────────────────────────────────
const TimeTable = ({route}) => {
  const {studentData: paramStudentData} = route?.params || {};

  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let data = paramStudentData;
      if (!data) {
        const stored = await AsyncStorage.getItem('studentData');
        if (!stored) {
          setError('No student data found. Please log in again.');
          return;
        }
        data = JSON.parse(stored);
      }

      const classRoomId = resolveClassRoomId(data);

      if (!classRoomId) {
        setError('Class room ID not found in profile. Contact administrator.');
        return;
      }

      const response = await fetchTimetableByClassRoomId(
        classRoomId,
        'student',
        data.email,
      );

      if (Array.isArray(response) && response.length > 0) {
        const sorted = [...response].sort((a, b) => {
          const aw = a.weekday || a.day || a.dayOfWeek || '';
          const bw = b.weekday || b.day || b.dayOfWeek || '';
          return WEEKDAY_ORDER.indexOf(aw) - WEEKDAY_ORDER.indexOf(bw);
        });
        setTimetable(sorted);

        const todayName = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ][new Date().getDay()];

        const todayData = sorted.find(
          d => (d.weekday || d.day || d.dayOfWeek) === todayName,
        );
        const firstDay =
          sorted[0]?.weekday || sorted[0]?.day || sorted[0]?.dayOfWeek || '';
        setSelectedDay(todayData ? todayName : firstDay);
      } else {
        setTimetable([]);
      }
    } catch (err) {
      setError('Failed to load timetable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [paramStudentData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const days = useMemo(
    () => timetable.map(d => d.weekday || d.day || d.dayOfWeek || ''),
    [timetable],
  );

  const selectedDayData = useMemo(
    () =>
      timetable.find(d => (d.weekday || d.day || d.dayOfWeek) === selectedDay),
    [timetable, selectedDay],
  );

  const currentAssignments = useMemo(
    () => processAssignments(selectedDayData?.assignments || []),
    [selectedDayData],
  );

  const renderItem = useCallback(({item}) => <PeriodRow item={item} />, []);

  const keyExtractor = useCallback(
    (item, index) =>
      item.id?.toString() || item.period?.id?.toString() || index.toString(),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StudentHeader />

      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Timetable</Text>
        <TouchableOpacity
          onPress={loadData}
          disabled={isLoading}
          style={styles.refreshBtn}
          activeOpacity={0.7}>
          <Ionicons
            name="refresh"
            size={18}
            color={isLoading ? '#94A3B8' : BRAND_COLOR}
          />
        </TouchableOpacity>
      </View>

      {/* Segmented Day Switcher */}
      {!isLoading && !error && days.length > 0 && (
        <View style={styles.dayBarContainer}>
          {days.map(day => {
            const isActive = day === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[styles.dayTab, isActive && styles.dayTabActive]}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.dayTabText,
                    isActive && styles.dayTabTextActive,
                  ]}>
                  {DAY_SHORT[day] || day.slice(0, 3).toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.hasDataDot,
                    isActive && styles.hasDataDotActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* List Container */}
      <View style={styles.contentBody}>
        {isLoading ? (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color={BRAND_COLOR} />
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredBox}>
            <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : timetable.length === 0 || currentAssignments.length === 0 ? (
          <View style={styles.centeredBox}>
            <Ionicons name="calendar-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No classes scheduled</Text>
          </View>
        ) : (
          <FlatList
            data={currentAssignments}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
          />
        )}
      </View>

      <StudentFooter />
    </SafeAreaView>
  );
};

export default TimeTable;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.1,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
  },

  // ── Day Segmented Bar
  dayBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  dayTabActive: {
    backgroundColor: BRAND_COLOR,
  },
  dayTabText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'DMSans-Bold',
  },
  dayTabTextActive: {
    color: '#FFFFFF',
  },
  hasDataDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
    marginTop: 2,
  },
  hasDataDotActive: {
    backgroundColor: '#FFFFFF',
  },

  // ── Content Area
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

  // ── Stacked Row (Height 52px for clean vertical breathing room)
  periodRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingRight: 16,
  },
  accentBar: {
    width: 3,
    height: '100%',
    backgroundColor: BRAND_COLOR,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 13,
    color: '#1E293B',
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 18,
  },
  teacherText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Poppins-Medium',
    lineHeight: 15,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodNumber: {
    fontSize: 13,
    color: BRAND_COLOR,
    fontFamily: 'Poppins-SemiBold',
    width: 16,
    textAlign: 'center',
  },
  periodNumberOff: {
    color: '#94A3B8',
  },
  timeStack: {
    alignItems: 'flex-end',
    width: 60,
  },
  timeText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'DMSans-Medium',
    lineHeight: 13,
  },

  // ── Off / Cancelled Overrides
  periodRowOff: {
    backgroundColor: '#F8FAFC',
  },
  accentBarOff: {
    backgroundColor: '#CBD5E1',
  },
  textOff: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  textOffSecondary: {
    color: '#CBD5E1',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 15,
  },

  // ── States
  centeredBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'DMSans-Medium',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    fontFamily: 'DMSans-Medium',
  },
  retryBtn: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins-Medium',
  },
});
