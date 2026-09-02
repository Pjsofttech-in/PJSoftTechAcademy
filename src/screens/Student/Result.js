import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchUserResultByStudentId} from '../../util/Apicall';
import StudentHeader from '../../components/StudentComponent/StudentHeader';
import StudentFooter from '../../components/StudentComponent/StudentFooter';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const BRAND_COLOR = '#6495ED';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = dateString => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const formatPercent = val => {
  if (val == null || val === '' || isNaN(Number(val))) return 'N/A';
  return `${Number(val).toFixed(2)}%`;
};

// ─── Single Detail Row ────────────────────────────────────────────────────────

const DetailRow = ({iconName, label, value}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Icon name={iconName} size={15} color="#64748B" />
      <Text style={styles.detailRowLabel}>{label}</Text>
    </View>
    <Text style={styles.detailRowValue} numberOfLines={1} ellipsizeMode="tail">
      {value || 'N/A'}
    </Text>
  </View>
);

// ─── Subject Card ─────────────────────────────────────────────────────────────

const SubjectCard = ({subject, index}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  const obtained = Number(subject.obtainedMarks) || 0;
  const passing = Number(subject.passingMarks) || 0;
  const total = Number(subject.totalMarks) || 1;

  const isPass = obtained >= passing;
  const statusColor = isPass ? '#059669' : '#DC2626';
  const statusBg = isPass ? '#ECFDF5' : '#FEF2F2';
  const fillPct = Math.min((obtained / total) * 100, 100);

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
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.subjectCard,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={styles.scRow}>
        <Text
          style={styles.scSubjectName}
          numberOfLines={1}
          ellipsizeMode="tail">
          {subject.subjectName || 'N/A'}
        </Text>
        <View style={[styles.scBadge, {backgroundColor: statusBg}]}>
          <Text style={[styles.scBadgeText, {color: statusColor}]}>
            {isPass ? 'PASS' : 'FAIL'}
          </Text>
        </View>
      </View>

      <View style={styles.scChipsRow}>
        {subject.examType ? (
          <View style={styles.scChip}>
            <Text style={styles.scChipText}>{subject.examType}</Text>
          </View>
        ) : null}
        {subject.paperType ? (
          <View style={styles.scChip}>
            <Text style={styles.scChipText}>{subject.paperType}</Text>
          </View>
        ) : null}
        <View style={styles.scChip}>
          <Text style={styles.scChipText}>Min: {passing}</Text>
        </View>
      </View>

      <View style={styles.scScoreRow}>
        <Text style={styles.scScoreText}>
          <Text style={styles.scScoreObtained}>{obtained}</Text>
          <Text style={styles.scScoreTotal}> / {total} marks</Text>
        </Text>
        <Text style={styles.scPct}>{fillPct.toFixed(1)}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${fillPct}%`,
              backgroundColor: isPass ? BRAND_COLOR : '#EF4444',
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Result = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);

  const fetchStudentResult = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const raw = await AsyncStorage.getItem('studentData');
      const stored = raw ? JSON.parse(raw) : null;
      const studentId = stored?.studentId || stored?.id || 8224;

      const response = await fetchUserResultByStudentId(studentId);
      setResultData(response);
    } catch (err) {
      console.error('Result fetch error:', err);
      setError(err.message || 'Failed to fetch result');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentResult();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StudentHeader />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={BRAND_COLOR} />
          <Text style={styles.loaderText}>Loading Academic Record...</Text>
        </View>
        <StudentFooter />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StudentHeader />
        <ScrollView
          contentContainerStyle={styles.stateWrap}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStudentResult(true)}
              colors={[BRAND_COLOR]}
            />
          }>
          <View style={styles.stateCard}>
            <Icon name="error-outline" size={32} color="#DC2626" />
            <Text style={styles.stateTitle}>Unable to Load Results</Text>
            <Text style={styles.stateMsg}>{error}</Text>
            <TouchableOpacity
              style={styles.stateBtn}
              onPress={() => fetchStudentResult()}
              activeOpacity={0.85}>
              <Text style={styles.stateBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <StudentFooter />
      </SafeAreaView>
    );
  }

  if (!resultData || Object.keys(resultData).length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StudentHeader />
        <ScrollView
          contentContainerStyle={styles.stateWrap}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStudentResult(true)}
              colors={[BRAND_COLOR]}
            />
          }>
          <View style={styles.stateCard}>
            <Icon name="assignment" size={32} color="#64748B" />
            <Text style={styles.stateTitle}>No Record Found</Text>
            <Text style={styles.stateMsg}>
              Your official examination record has not been published yet.
            </Text>
            <TouchableOpacity
              style={styles.stateBtn}
              onPress={() => fetchStudentResult()}
              activeOpacity={0.85}>
              <Text style={styles.stateBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <StudentFooter />
      </SafeAreaView>
    );
  }

  const isPass = resultData.status?.toLowerCase() === 'pass';
  const statusColor = isPass ? '#059669' : '#DC2626';
  const statusBg = isPass ? '#ECFDF5' : '#FEF2F2';
  const subjectList = resultData.subjectResults || [];
  const pctDisplay = formatPercent(resultData.percentage);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStudentResult(true)}
            colors={[BRAND_COLOR]}
          />
        }>
        {/* Header Title Section */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.headerTitle}>Examination Summary</Text>
            <Text style={styles.headerSub}>
              Academic Session {resultData.academicYear || 'N/A'}
            </Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusBg}]}>
            <Text style={[styles.statusBadgeText, {color: statusColor}]}>
              {resultData.status?.toUpperCase() || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Hero Performance Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Overall Grade</Text>
              <Text style={styles.heroPercentage}>{pctDisplay}</Text>
            </View>
            <View style={styles.heroIconBox}>
              <Icon
                name={isPass ? 'verified' : 'highlight-off'}
                size={36}
                color={isPass ? BRAND_COLOR : '#EF4444'}
              />
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {resultData.totalObtainedMarks ?? '—'}
              </Text>
              <Text style={styles.metricLabel}>Obtained</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {resultData.totalSubjectMarks ?? '—'}
              </Text>
              <Text style={styles.metricLabel}>Max Marks</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{subjectList.length}</Text>
              <Text style={styles.metricLabel}>Subjects</Text>
            </View>
          </View>
        </View>

        {/* Student Meta Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Student Particulars</Text>
          <View style={styles.detailList}>
            <DetailRow
              iconName="person-outline"
              label="Student Name"
              value={resultData.studentName}
            />
            <DetailRow
              iconName="numbers"
              label="Roll Number"
              value={
                resultData.rollno != null ? String(resultData.rollno) : 'N/A'
              }
            />
            <DetailRow
              iconName="school"
              label="Course"
              value={resultData.coursename}
            />
            <DetailRow
              iconName="groups"
              label="Batch"
              value={resultData.batchName}
            />
            <DetailRow
              iconName="language"
              label="Medium"
              value={resultData.mediumName}
            />
            <DetailRow
              iconName="event"
              label="Result Date"
              value={formatDate(resultData.resultDate)}
            />
          </View>
        </View>

        {/* Subject Results Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Subject Breakdown</Text>
          <Text style={styles.sectionHeaderSub}>
            {subjectList.length} total subjects
          </Text>
        </View>

        {subjectList.length > 0 ? (
          subjectList.map((subject, index) => (
            <SubjectCard key={index} subject={subject} index={index} />
          ))
        ) : (
          <View style={styles.emptySubjects}>
            <Text style={styles.emptySubjectsText}>
              No subject score breakdown available.
            </Text>
          </View>
        )}
      </ScrollView>

      <StudentFooter />
    </SafeAreaView>
  );
};

export default Result;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  stateWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  stateMsg: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  stateBtn: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  stateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  heroIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metricSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRowLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeaderSub: {
    fontSize: 12,
    color: '#64748B',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  scRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scSubjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  scBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  scChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  scScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  scScoreText: {
    fontSize: 12,
  },
  scScoreObtained: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  scScoreTotal: {
    color: '#64748B',
  },
  scPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptySubjects: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptySubjectsText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
