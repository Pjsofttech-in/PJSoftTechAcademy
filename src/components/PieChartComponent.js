import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {PieChart} from 'react-native-gifted-charts';
import ExamPaperTypeSelector from './ExamPaperTypeSelector';
import {
  fetchPassFailData,
  fetchExamTypes,
  fetchPaperTypes,
} from '../util/Apicall';
import {useAuth} from '../auth/AuthContext';

const screenWidth = Dimensions.get('window').width;

// ── Theme Palette ─────────────────────────────────────────────────────────────
const P = {
  brand: '#6366f1',
  pass: '#10B981',
  passBg: '#ECFDF5',
  fail: '#EF4444',
  failBg: '#FEF2F2',
  text: '#0F172A',
  sub: '#64748B',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
};

const PieChartComponent = ({userData: propUserData}) => {
  const {userData: authUserData} = useAuth();
  const userData = propUserData || authUserData;

  const [selectedExamType, setSelectedExamType] = useState('ALL');
  const [selectedPaperType, setSelectedPaperType] = useState('ALL');
  const [passFailData, setPassFailData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Data Loader ─────────────────────────────────────────────────────────────
  const loadPassFailData = async (
    examType = selectedExamType,
    paperType = selectedPaperType,
  ) => {
    if (!userData?.email) return;

    try {
      setLoading(true);
      const payload = {
        role:
          userData.role === 'branch' ? 'teacher' : userData.role || 'teacher',
        email: userData.email,
      };

      if (examType !== 'ALL') payload.examType = examType;
      if (paperType !== 'ALL') payload.paperType = paperType;

      const response = await fetchPassFailData(userData.email, payload);
      const data = response?.[0] || {};

      const pass = Number(data.passCount) || 0;
      const fail = Number(data.failCount) || 0;
      const total = pass + fail;

      // Handle edge cases cleanly without rendering invisible dynamic slices
      let chartData = [];
      if (total === 0) {
        chartData = [
          {value: 1, actualValue: 0, color: '#E2E8F0', label: 'NO DATA'},
        ];
      } else {
        if (pass > 0) {
          chartData.push({
            value: pass,
            actualValue: pass,
            color: P.pass,
            label: 'PASS',
          });
        }
        if (fail > 0) {
          chartData.push({
            value: fail,
            actualValue: fail,
            color: P.fail,
            label: 'FAIL',
          });
        }
      }

      setPassFailData(chartData);

      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Error loading pass/fail analytics:', err);
      setPassFailData([
        {value: 1, actualValue: 0, color: '#E2E8F0', label: 'NO DATA'},
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExamTypeChange = val => {
    const v = val?.examType || 'ALL';
    setSelectedExamType(v);
    loadPassFailData(v, selectedPaperType);
  };

  const handlePaperTypeChange = val => {
    const v = val?.paperType || 'ALL';
    setSelectedPaperType(v);
    loadPassFailData(selectedExamType, v);
  };

  useEffect(() => {
    if (userData?.email) {
      loadPassFailData();
    }
  }, [userData?.email]);

  // ── Stats Calculations ──────────────────────────────────────────────────────
  const passItem = passFailData.find(i => i.label === 'PASS') || {
    actualValue: 0,
  };
  const failItem = passFailData.find(i => i.label === 'FAIL') || {
    actualValue: 0,
  };

  const passCount = passItem.actualValue;
  const failCount = failItem.actualValue;
  const totalStudents = passCount + failCount;

  const passPercent =
    totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;
  const failPercent =
    totalStudents > 0 ? Math.round((failCount / totalStudents) * 100) : 0;

  return (
    <View style={S.container}>
      {/* ── Header & Filter Bar ── */}
      <View style={S.header}>
        <View style={S.titleRow}>
          <Text style={S.title}>Pass / Fail Overview</Text>
          <View style={S.totalBadge}>
            <Text style={S.totalBadgeTxt}>{totalStudents} Students</Text>
          </View>
        </View>

        <View style={S.filtersCard}>
          <ExamPaperTypeSelector
            onExamTypeChange={handleExamTypeChange}
            onPaperTypeChange={handlePaperTypeChange}
            userData={userData}
            customTextStyle={{fontSize: 12}}
          />
        </View>
      </View>

      {/* ── Body Content ── */}
      <View style={S.body}>
        {loading ? (
          <View style={S.loadingContainer}>
            <ActivityIndicator size="large" color={P.brand} />
            <Text style={S.loadingText}>Updating analytics...</Text>
          </View>
        ) : (
          <Animated.View style={[S.contentWrapper, {opacity: fadeAnim}]}>
            {/* ── ERP Quick Metrics Bar ── */}
            <View style={S.metricsBar}>
              <View style={S.metricTile}>
                <Text style={S.metricLabel}>Total</Text>
                <Text style={S.metricValue}>{totalStudents}</Text>
              </View>
              <View style={S.metricDivider} />
              <View style={S.metricTile}>
                <Text style={S.metricLabel}>Passed</Text>
                <Text style={[S.metricValue, {color: P.pass}]}>
                  {passCount}
                </Text>
              </View>
              <View style={S.metricDivider} />
              <View style={S.metricTile}>
                <Text style={S.metricLabel}>Failed</Text>
                <Text style={[S.metricValue, {color: P.fail}]}>
                  {failCount}
                </Text>
              </View>
              <View style={S.metricDivider} />
              <View style={S.metricTile}>
                <Text style={S.metricLabel}>Pass Rate</Text>
                <Text style={[S.metricValue, {color: P.pass}]}>
                  {passPercent}%
                </Text>
              </View>
            </View>

            {/* ── Pie Chart + Side Legend ── */}
            <View style={S.chartGrid}>
              {/* Pie */}
              <View style={S.pieWrapper}>
                <PieChart
                  data={passFailData}
                  radius={screenWidth * 0.18}
                  innerRadius={screenWidth * 0.11}
                  strokeColor="#FFFFFF"
                  strokeWidth={3}
                  focusOnPress={false}
                  shadow
                  shadowColor="#000000"
                  shadowOpacity={0.08}
                  shadowRadius={8}
                  isAnimated
                  animationDuration={500}
                  centerLabelComponent={() => (
                    <View style={S.centerLabel}>
                      <Text style={S.centerVal}>{totalStudents}</Text>
                      <Text style={S.centerSub}>Total</Text>
                    </View>
                  )}
                />
              </View>

              {/* Legend Cards */}
              <View style={S.legendWrapper}>
                {/* PASS Card */}
                <View style={[S.legendCard, {borderLeftColor: P.pass}]}>
                  <View style={S.legendTop}>
                    <Text style={[S.legendTitle, {color: P.pass}]}>PASS</Text>
                    <Text style={S.legendPercent}>{passPercent}%</Text>
                  </View>
                  <Text style={S.legendSub}>
                    {passCount} {passCount === 1 ? 'Student' : 'Students'}
                  </Text>
                  <View style={S.trackBg}>
                    <View
                      style={[
                        S.trackFill,
                        {width: `${passPercent}%`, backgroundColor: P.pass},
                      ]}
                    />
                  </View>
                </View>

                {/* FAIL Card */}
                <View style={[S.legendCard, {borderLeftColor: P.fail}]}>
                  <View style={S.legendTop}>
                    <Text style={[S.legendTitle, {color: P.fail}]}>FAIL</Text>
                    <Text style={S.legendPercent}>{failPercent}%</Text>
                  </View>
                  <Text style={S.legendSub}>
                    {failCount} {failCount === 1 ? 'Student' : 'Students'}
                  </Text>
                  <View style={S.trackBg}>
                    <View
                      style={[
                        S.trackFill,
                        {width: `${failPercent}%`, backgroundColor: P.fail},
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default PieChartComponent;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: P.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: P.text,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {elevation: 2},
    }),
  },
  header: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    color: P.text,
  },
  totalBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  totalBadgeTxt: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: P.sub,
  },
  filtersCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: P.border,
  },
  body: {
    padding: 14,
    backgroundColor: '#FAFBFC',
  },
  contentWrapper: {
    gap: 14,
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: P.border,
  },
  metricTile: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    color: P.sub,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    color: P.text,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: P.border,
  },
  chartGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerVal: {
    fontSize: 20,
    fontFamily: 'DMSans-Bold',
    color: P.text,
    lineHeight: 22,
  },
  centerSub: {
    fontSize: 9,
    fontFamily: 'DMSans-Medium',
    color: P.sub,
  },
  legendWrapper: {
    flex: 1,
    gap: 10,
    paddingLeft: 10,
  },
  legendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: P.border,
  },
  legendTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendTitle: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    letterSpacing: 0.3,
  },
  legendPercent: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    color: P.text,
  },
  legendSub: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: P.sub,
    marginBottom: 6,
  },
  trackBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: P.sub,
    marginTop: 10,
  },
});
