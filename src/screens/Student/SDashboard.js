// SDashboard.js
import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import StudentHeader from '../../components/StudentComponent/StudentHeader';
import StudentFooter from '../../components/StudentComponent/StudentFooter';
import BarChartComponent from '../../components/StudentComponent/BarChartComponent';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* ── Brand Color Tokens ─────────────────────────────────────────── */
const BRAND_COLOR = '#6495ED';
const BRAND_BG_LIGHT = '#F0F5FE';
const BRAND_BORDER = '#D6E4FF';

/* ── Greeting Helper ────────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/* ── Main Component ─────────────────────────────────────────────── */
const SDashboard = ({route, navigation}) => {
  const {studentData: initialStudentData} = route.params || {};
  const [studentData, setStudentData] = useState(initialStudentData || null);
  const [isLoadingStudentData, setIsLoadingStudentData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudentData = async () => {
    if (initialStudentData) {
      setStudentData(initialStudentData);
      setIsLoadingStudentData(false);
      setRefreshing(false);
      return;
    }
    try {
      const storedData = await AsyncStorage.getItem('studentData');
      if (storedData) {
        setStudentData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error(' Error loading student data:', error);
    } finally {
      setIsLoadingStudentData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [initialStudentData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentData();
  };

  const navigateTo = screenName => {
    try {
      navigation.navigate(screenName, {studentData});
    } catch (e) {
      console.warn('Navigation failed:', e);
    }
  };

  /* ── Loading State ── */
  if (isLoadingStudentData) {
    return (
      <SafeAreaView style={styles.container}>
        <StudentHeader />
        <View style={styles.stateCard}>
          <ActivityIndicator size="small" color={BRAND_COLOR} />
          <Text style={styles.stateSub}>Fetching profile data...</Text>
        </View>
        <StudentFooter />
      </SafeAreaView>
    );
  }

  /* ── Error / Fallback State ── */
  if (!studentData) {
    return (
      <SafeAreaView style={styles.container}>
        <StudentHeader />
        <View style={styles.stateCard}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          </View>
          <Text style={styles.stateTitle}>Data Unavailable</Text>
          <Text style={styles.stateSub}>
            Student records could not be resolved. Please authenticate again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.7}
            onPress={() =>
              navigation.reset({index: 0, routes: [{name: 'Role'}]})
            }>
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
        <StudentFooter />
      </SafeAreaView>
    );
  }

  const firstName = studentData?.name?.split(' ')[0] || 'Student';
  const rollNumber = studentData?.rollNo || studentData?.rollNumber;

  return (
    <SafeAreaView style={styles.container}>
      <StudentHeader />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_COLOR]}
            tintColor={BRAND_COLOR}
          />
        }>
        {/* ── Compact Profile Card ─────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileLeft}>
              <View style={styles.classBadge}>
                <Ionicons name="school-outline" size={18} color={BRAND_COLOR} />
              </View>
              <View>
                <Text style={styles.greetingText}>{getGreeting()},</Text>
                <Text style={styles.studentName}>
                  {studentData?.name || 'Student'}
                </Text>
              </View>
            </View>

            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {firstName[0].toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Compact Info Badges */}
          <View style={styles.metaContainer}>
            {rollNumber && (
              <View style={styles.metaRow}>
                <Ionicons name="id-card-outline" size={13} color="#64748B" />
                <Text style={styles.metaText}>Roll No: {rollNumber}</Text>
              </View>
            )}

            {studentData?.course && (
              <View style={styles.metaRow}>
                <Ionicons name="book-outline" size={13} color="#64748B" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {studentData.course?.coursename || studentData.course}
                </Text>
              </View>
            )}

            {studentData?.batchName && (
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={13} color="#64748B" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {studentData.batchName}
                </Text>
              </View>
            )}

            {studentData?.email && (
              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={13} color="#64748B" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {studentData.email}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Section Title ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>ATTENDANCE ANALYTICS</Text>

        {/* ── Attendance Chart Component ───────────────────────────── */}
        <View style={styles.chartWrapper}>
          <BarChartComponent studentData={studentData} />
        </View>
      </ScrollView>

      <StudentFooter />
    </SafeAreaView>
  );
};

export default SDashboard;

/* ─── Compact Industrial Styling ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 90,
  },

  /* Compact Profile Card */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  classBadge: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: BRAND_BG_LIGHT,
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'DMSans-Regular',
  },
  studentName: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: 'DMSans-Bold',
    letterSpacing: -0.2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_BG_LIGHT,
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: BRAND_COLOR,
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
  },

  /* Metadata Container */
  metaContainer: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'DMSans-Medium',
    flex: 1,
  },

  /* Section Header */
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'DMSans-Bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 6,
  },
  chartWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },

  /* State / Fallback Cards */
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    marginHorizontal: 12,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 13,
    fontFamily: 'DMSans-Bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  stateSub: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
  },
});
