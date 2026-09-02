// BarChartComponent.js
import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {fetchAttendanceCountByFormId} from '../../util/Apicall';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* ─── Pill Filter Button ─────────────────────────────────────────────────── */
const FilterPill = ({label, active, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[pillStyles.pill, active && pillStyles.pillActive]}>
    <Text style={[pillStyles.label, active && pillStyles.labelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* ─── Single Animated Bar ────────────────────────────────────────────────── */
const AnimatedBar = ({barHeight, colors, delay, count, maxBarHeight}) => {
  // Drives height (layout prop) — MUST use useNativeDriver: false
  const progress = useRef(new Animated.Value(0)).current;
  // Drive opacity + translateY — safe for useNativeDriver: true
  const fadeIn = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(8)).current;

  const h = barHeight || 0;

  useEffect(() => {
    progress.setValue(0);
    fadeIn.setValue(0);
    labelY.setValue(8);

    // Height grows bottom-up — layout animation, no native driver
    Animated.spring(progress, {
      toValue: 1,
      delay,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();

    // Fade + label slide — native driver OK (opacity + transform only)
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(labelY, {
        toValue: 0,
        delay: delay + 120,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [barHeight, delay]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, h],
  });

  return (
    <View
      style={{
        height: maxBarHeight,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
      {/* Label fades + slides down — native driver safe */}
      <Animated.Text
        style={[
          barStyles.floatLabel,
          {opacity: fadeIn, transform: [{translateY: labelY}]},
        ]}>
        {count}
      </Animated.Text>

      {/* Plain View carries the shadow — shadow props must NOT be on Animated.View */}
      <View
        style={{
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          shadowColor: colors[1],
          shadowOffset: {width: 0, height: 6},
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
        }}>
        {/* Animated.View only controls height — no opacity, no shadow, no transform */}
        <Animated.View
          style={{
            width: 52,
            height: animatedHeight,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={colors}
            style={{flex: 1}}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}>
            <View style={barStyles.shine} />
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
};

/* ─── Chart Body ─────────────────────────────────────────────────────────── */
const ChartBody = ({data}) => {
  if (!data) return null;

  const {presentCount = 0, absentCount = 0, dateRange} = data;
  const total = presentCount + absentCount;
  const maxValue = Math.max(presentCount, absentCount, 1);

  const MAX_H = 170;
  const MIN_H = 8;

  const presentH =
    presentCount > 0 ? Math.max(MIN_H, (presentCount / maxValue) * MAX_H) : 0;
  const absentH =
    absentCount > 0 ? Math.max(MIN_H, (absentCount / maxValue) * MAX_H) : 0;

  const presentPct =
    total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0';
  const absentPct =
    total > 0 ? ((absentCount / total) * 100).toFixed(1) : '0.0';

  /* Y-axis ticks */
  const ticks = [
    maxValue,
    Math.ceil(maxValue * 0.66),
    Math.ceil(maxValue * 0.33),
    0,
  ];

  return (
    <View>
      {/* ── Stat Pills ── */}
      <View style={chartBodyStyles.statRow}>
        {/* Present */}
        <View style={[chartBodyStyles.statPill, chartBodyStyles.presentPill]}>
          <View style={chartBodyStyles.statPillIcon}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          </View>
          <View>
            <Text style={[chartBodyStyles.statBig, {color: '#10b981'}]}>
              {presentCount}
            </Text>
            <Text style={chartBodyStyles.statSub}>Present · {presentPct}%</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={chartBodyStyles.statDivider} />

        {/* Absent */}
        <View style={[chartBodyStyles.statPill, chartBodyStyles.absentPill]}>
          <View style={chartBodyStyles.statPillIcon}>
            <Ionicons name="close-circle" size={16} color="#ef4444" />
          </View>
          <View>
            <Text style={[chartBodyStyles.statBig, {color: '#ef4444'}]}>
              {absentCount}
            </Text>
            <Text style={chartBodyStyles.statSub}>Absent · {absentPct}%</Text>
          </View>
        </View>
      </View>

      {/* ── Bar Chart ── */}
      <View style={chartBodyStyles.chartWrap}>
        {/* Y-Axis */}
        <View style={chartBodyStyles.yAxis}>
          {ticks.map((t, i) => (
            <Text key={i} style={chartBodyStyles.yTick}>
              {t}
            </Text>
          ))}
        </View>

        {/* Grid + Bars */}
        <View style={{flex: 1}}>
          {/* Grid lines */}
          <View style={[StyleSheet.absoluteFill, chartBodyStyles.gridWrap]}>
            {ticks.map((_, i) => (
              <View key={i} style={chartBodyStyles.gridLine} />
            ))}
          </View>

          {/* Bars */}
          <View style={chartBodyStyles.barsRow}>
            {/* Present */}
            <View style={chartBodyStyles.barCol}>
              <AnimatedBar
                barHeight={presentH}
                colors={['#34d399', '#10b981']}
                delay={200}
                count={presentCount}
                maxBarHeight={MAX_H}
              />
              <View style={chartBodyStyles.xLabel}>
                <View
                  style={[chartBodyStyles.xDot, {backgroundColor: '#10b981'}]}
                />
                <Text style={chartBodyStyles.xLabelText}>Present</Text>
              </View>
            </View>

            {/* Gap bar (visual spacing) */}
            <View style={{width: 36}} />

            {/* Absent */}
            <View style={chartBodyStyles.barCol}>
              <AnimatedBar
                barHeight={absentH}
                colors={['#fd5050', '#d50000']}
                delay={380}
                count={absentCount}
                maxBarHeight={MAX_H}
              />
              <View style={chartBodyStyles.xLabel}>
                <View
                  style={[chartBodyStyles.xDot, {backgroundColor: '#d50000'}]}
                />
                <Text style={chartBodyStyles.xLabelText}>Absent</Text>
              </View>
            </View>
          </View>

          {/* X-axis line */}
          <View style={chartBodyStyles.xAxisLine} />
        </View>
      </View>

      {/* ── Progress Bar (ratio) ── */}
      <View style={chartBodyStyles.ratioWrap}>
        <View style={chartBodyStyles.ratioTrack}>
          <Animated.View
            style={[
              chartBodyStyles.ratioFill,
              {
                width: `${parseFloat(presentPct)}%`,
                backgroundColor: '#10b981',
              },
            ]}
          />
        </View>
        <Text style={chartBodyStyles.ratioHint}>
          {presentPct}% attendance rate
        </Text>
      </View>

      {/* ── Date Range ── */}
      {dateRange && (
        <View style={chartBodyStyles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color="#818cf8" />
          <Text style={chartBodyStyles.dateText}>
            {dateRange.from} → {dateRange.to}
          </Text>
        </View>
      )}
    </View>
  );
};

/* ─── Main Export ────────────────────────────────────────────────────────── */
const BarChartComponent = ({studentData}) => {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Today');
  const [attendanceData, setAttendanceData] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  const FILTERS = ['Today', '7 Days', 'Custom'];

  const fetchData = async (filterKey, customFrom = null, customTo = null) => {
    if (!studentData) return;
    setLoading(true);
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
    } catch (e) {
      console.error('Attendance fetch error:', e);
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      studentData?.formId &&
      studentData?.admissionId &&
      studentData?.branchCode
    ) {
      fetchData('today');
    }
  }, [studentData]);

  const onFilterPress = value => {
    setFilter(value);
    if (value === 'Custom') {
      setShowFromPicker(true);
    } else if (value === '7 Days') {
      fetchData('7days');
    } else {
      fetchData('today');
    }
  };

  const onFromChange = (_, selected) => {
    const d = selected || fromDate;
    setShowFromPicker(Platform.OS === 'ios');
    setFromDate(d);
    setShowToPicker(true);
  };

  const onToChange = (_, selected) => {
    const d = selected || toDate;
    setShowToPicker(false);
    setToDate(d);
    const from = fromDate.toISOString().split('T')[0];
    const to = d.toISOString().split('T')[0];
    fetchData('custom', from, to);
  };

  /* ── Empty / No-data state ── */
  const isEmpty =
    !attendanceData ||
    (attendanceData.presentCount === 0 && attendanceData.absentCount === 0);

  return (
    <View style={compStyles.card}>
      {/* Card Header */}
      <View style={compStyles.cardHeader}>
        <View style={compStyles.headerLeft}>
          <LinearGradient
            colors={['#818cf8', '#6366f1']}
            style={compStyles.headerIcon}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Ionicons name="stats-chart" size={14} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={compStyles.cardTitle}>Attendance Stats</Text>
            <Text style={compStyles.cardSub}>Your daily overview</Text>
          </View>
        </View>

        {/* Total badge */}
        {attendanceData && (
          <View style={compStyles.totalBadge}>
            <Text style={compStyles.totalText}>
              {(attendanceData.presentCount || 0) +
                (attendanceData.absentCount || 0)}{' '}
              Total
            </Text>
          </View>
        )}
      </View>

      {/* Filter Pills */}
      <View style={compStyles.pillRow}>
        {FILTERS.map(f => (
          <FilterPill
            key={f}
            label={f}
            active={filter === f}
            onPress={() => onFilterPress(f)}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={compStyles.divider} />

      {/* Content */}
      {loading ? (
        <View style={compStyles.centerBox}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={compStyles.centerText}>Fetching data…</Text>
        </View>
      ) : isEmpty ? (
        <View style={compStyles.centerBox}>
          <View style={compStyles.emptyIcon}>
            <Ionicons name="bar-chart-outline" size={32} color="#c7d2fe" />
          </View>
          <Text style={compStyles.emptyTitle}>No Records Found</Text>
          <Text style={compStyles.centerText}>
            {filter === 'Custom'
              ? 'No data for the selected range'
              : 'No attendance data for this period'}
          </Text>
        </View>
      ) : (
        <ChartBody data={attendanceData} />
      )}

      {/* Date pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={onFromChange}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={onToChange}
        />
      )}
    </View>
  );
};

export default BarChartComponent;

/* ─── Pill Styles ────────────────────────────────────────────────────────── */
const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#f5f5ff',
  },
  pillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: '#6366f1',
  },
  labelActive: {
    color: '#fff',
    fontFamily: 'DMSans-Bold',
  },
});

/* ─── Bar Styles ─────────────────────────────────────────────────────────── */
const barStyles = StyleSheet.create({
  floatLabel: {
    fontSize: 13,
    fontFamily: 'DMSans-Bold',
    color: '#1A2332',
    marginBottom: 4,
  },
  shine: {
    position: 'absolute',
    top: 6,
    left: 9,
    width: 7,
    bottom: 6,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
});

/* ─── Chart Body Styles ──────────────────────────────────────────────────── */
const chartBodyStyles = StyleSheet.create({
  /* Stat pills */
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginBottom: 20,
    overflow: 'hidden',
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  presentPill: {
    backgroundColor: '#f0fdf4',
  },
  absentPill: {
    backgroundColor: '#fff5f5',
  },
  statPillIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statBig: {
    fontSize: 20,
    fontFamily: 'DMSans-Bold',
    letterSpacing: -0.5,
  },
  statSub: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: '#9AAABB',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEF2F7',
  },

  /* Chart */
  chartWrap: {
    flexDirection: 'row',
    height: 215,
    marginBottom: 18,
  },
  yAxis: {
    width: 34,
    justifyContent: 'space-between',
    paddingBottom: 26,
    paddingTop: 4,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  yTick: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: '#B0BEC5',
  },
  gridWrap: {
    justifyContent: 'space-between',
    paddingBottom: 26,
    paddingTop: 4,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#EEF2F7',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 4,
    paddingTop: 4,
  },
  barCol: {
    alignItems: 'center',
  },
  xAxisLine: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
  },
  xLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  xDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  xLabelText: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: '#6B7A8D',
  },

  /* Ratio progress bar */
  ratioWrap: {
    marginBottom: 12,
    gap: 6,
  },
  ratioTrack: {
    height: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    overflow: 'hidden',
  },
  ratioFill: {
    height: '100%',
    borderRadius: 6,
  },
  ratioHint: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: '#9AAABB',
    textAlign: 'right',
  },

  /* Date row */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: '#818cf8',
  },
});

/* ─── Component (Card) Styles ────────────────────────────────────────────── */
const compStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#ebebff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: '#1A2332',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: '#9AAABB',
    marginTop: 1,
  },
  totalBadge: {
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  totalText: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    color: '#6366f1',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginBottom: 16,
  },

  /* Center states */
  centerBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  centerText: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: '#9AAABB',
    textAlign: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: '#3D4F62',
  },
});
