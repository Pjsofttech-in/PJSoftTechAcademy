import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { MaterialDesignIcons as Icon } from '@react-native-vector-icons/material-design-icons';

import {useAuth} from '../../auth/AuthContext';
import {fetchTimetableByClassRoomId} from '../../util/Apicall';

// ─── Color palette for period cards ───────────────────────────────────────────
const COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const getPeriodColor = index => COLORS[index % COLORS.length];

// ─── Single Period Card ────────────────────────────────────────────────────────
const PeriodCard = ({assignment, color}) => {
  const subject = assignment?.subject?.subjectName || '--';
  const teacher = assignment?.teacher?.teacherName || '--';
  const startTime = assignment?.period?.startTime || '';
  const endTime = assignment?.period?.endTime || '';
  const status = assignment?.status; // 'ON' | 'OFF' | undefined

  const isOn = status === 'ON';

  return (
    <View style={[styles.periodCard, {backgroundColor: color}]}>
      {/* ON / OFF badge — always visible */}
      <View
        style={[
          styles.statusBadge,
          {backgroundColor: isOn ? '#007b2d' : '#cf0000'},
        ]}>
        <Text style={styles.statusBadgeText}>{isOn ? 'ON' : 'OFF'}</Text>
      </View>

      <View style={styles.cardContent}>
        {/* Time */}
        <View style={styles.timeRow}>
          <Icon name="clock-outline" size={12} color="#FFFFFF" />
          <Text style={styles.timeText}>
            {startTime} - {endTime}
          </Text>
        </View>

        {/* Subject */}
        <Text style={styles.cardSubject} numberOfLines={2}>
          {subject}
        </Text>

        {/* Teacher */}
        <Text style={styles.cardTeacher} numberOfLines={1}>
          {teacher}
        </Text>
      </View>
    </View>
  );
};

// ─── Lunch Break Card ──────────────────────────────────────────────────────────
const LunchBreakCard = () => (
  <View style={styles.lunchCard}>
    <View style={styles.timeRow}>
      <Icon name="food" size={12} color="#282828" />
      <Text style={styles.lunchTitle}>Lunch Break</Text>
    </View>
    <Text style={styles.lunchSub}>Break Time</Text>
  </View>
);

// ─── Day Column ────────────────────────────────────────────────────────────────
const DayColumn = ({day}) => {
  const rawAssignments = day?.assignments || [];

  // Deduplicate by period.id
  const unique = rawAssignments.filter(
    (a, i, arr) => arr.findIndex(b => b.period?.id === a.period?.id) === i,
  );

  // Sort by periodNo ascending
  const sorted = [...unique].sort(
    (a, b) => (a.period?.periodNo ?? 0) - (b.period?.periodNo ?? 0),
  );

  // Insert lunch break placeholder after period 4
  const withLunch = [];
  sorted.forEach(a => {
    withLunch.push(a);
    if (a.period?.periodNo === 4) {
      withLunch.push({isLunchBreak: true});
    }
  });

  const dayLabel = (day?.weekday || day?.day || day?.dayOfWeek || 'N/A')
    .slice(0, 3)
    .toUpperCase();

  return (
    <View style={styles.dayColumn}>
      {/* Day header chip */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>{dayLabel}</Text>
      </View>

      {/* Period cards */}
      <View style={styles.periodsContainer}>
        {withLunch.length === 0 ? (
          <View style={styles.emptyDayCell}>
            <Text style={styles.emptyDayText}>—</Text>
          </View>
        ) : (
          withLunch.map((item, index) => {
            if (item.isLunchBreak) {
              return <LunchBreakCard key={`lunch-${index}`} />;
            }
            const color = getPeriodColor((item.period?.periodNo ?? 1) - 1);
            return (
              <PeriodCard
                key={item.id || index}
                assignment={item}
                color={color}
              />
            );
          })
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const Timetable = ({route}) => {
  const {classroom} = route.params;
  const {userData, token} = useAuth();

  const [loading, setLoading] = useState(true);
  const [timeTable, setTimeTable] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimeTable();
  }, []);

  const fetchTimeTable = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetchTimetableByClassRoomId(
        classroom.id,
        'teacher',
        userData.email,
        token,
      );

      setTimeTable(response || []);
    } catch (err) {
      console.log('TimeTable Error : ', err);
      setError('Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  };

  const WEEKDAY_ORDER = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const sortedTable = [...timeTable].sort((a, b) => {
    const aDay = a.weekday || a.day || a.dayOfWeek || '';
    const bDay = b.weekday || b.day || b.dayOfWeek || '';
    return WEEKDAY_ORDER.indexOf(aDay) - WEEKDAY_ORDER.indexOf(bDay);
  });

  const totalOnPeriods = timeTable.reduce((acc, day) => {
    return acc + (day.assignments || []).filter(a => a.status === 'ON').length;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Class Timetable</Text>
          <Text style={styles.headerSubtitle}>
            {classroom?.name || 'Weekly Schedule'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchTimeTable}
          disabled={loading}
          style={styles.refreshBtn}>
          <Ionicons
            name="refresh"
            size={20}
            color={loading ? '#9CA3AF' : '#6366F1'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading timetable...</Text>
        </View>
      ) : error ? (
        /* ── Error ────────────────────────────────────────────────── */
        <View style={styles.centeredBox}>
          <Icon name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTimeTable}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sortedTable.length === 0 ? (
        /* ── Empty ────────────────────────────────────────────────── */
        <View style={styles.centeredBox}>
          <Icon name="calendar-blank" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No timetable data available</Text>
        </View>
      ) : (
        /* ── Timetable content ────────────────────────────────────── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 32}}>
          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <View style={{flex: 1}}>
              <Text style={styles.statusText}>Schedule Active</Text>
              <Text style={styles.statusSub}>
                {totalOnPeriods} period{totalOnPeriods !== 1 ? 's' : ''}{' '}
                currently ON
              </Text>
            </View>
          </View>

          {/* ── Horizontal period grid — ONLY this, no day details below ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekScroll}
            contentContainerStyle={styles.weekScrollContent}>
            {sortedTable.map((day, index) => (
              <DayColumn
                key={`${day.weekday || day.day || index}-${index}`}
                day={day}
              />
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Timetable;

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerContent: {flex: 1},
  headerTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'DMSans-Medium',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  // ── Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'DMSans-Medium',
  },

  // ── Error / Empty centred box
  centeredBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontFamily: 'DMSans-Medium',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'DMSans-Medium',
  },
  retryBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },

  // ── Status Banner
  statusBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#065F46',
    fontFamily: 'Poppins-SemiBold',
  },
  statusSub: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'DMSans-Medium',
  },

  // ── Week horizontal scroll
  weekScroll: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  weekScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
    alignItems: 'flex-start',
  },

  // ── Day Column
  dayColumn: {
    width: 112,
    alignItems: 'center',
  },
  dayHeader: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-SemiBold',
  },
  periodsContainer: {
    width: '100%',
    gap: 6,
  },

  // ── Period Card
  periodCard: {
    borderRadius: 12,
    padding: 10,
    minHeight: 82,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },

  // ON / OFF badge (top-right corner of card)
  statusBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 10,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.3,
  },

  cardContent: {gap: 5, marginTop: 4},
  timeRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  timeText: {
    fontSize: 9,
    color: '#F3F4F6',
    letterSpacing: 0.2,
    fontFamily: 'DMSans-Medium',
  },
  cardSubject: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 16,
  },
  cardTeacher: {
    fontSize: 10,
    color: '#F3F4F6',
    opacity: 0.9,
    fontFamily: 'DMSans-Medium',
  },

  // ── Lunch Break Card
  lunchCard: {
    borderRadius: 12,
    padding: 8,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: '#E9E9E9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    gap: 4,
  },
  lunchTitle: {
    fontSize: 10,
    color: '#282828',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2,
  },
  lunchSub: {
    fontSize: 10,
    color: '#282828',
    opacity: 0.7,
    fontFamily: 'DMSans-Medium',
  },

  // ── Empty day placeholder
  emptyDayCell: {alignItems: 'center', paddingVertical: 20},
  emptyDayText: {fontSize: 16, color: '#D1D5DB', fontFamily: 'DMSans-Medium'},
});
