import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../auth/AuthContext';
import {useNavigation} from '@react-navigation/native';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {
  fetchClassroomByTeacher,
  getInstituteDetailsApi,
} from '../../util/Apicall';

/* ── Brand Theme System ─────────────────────────────────────────────────── */
const BRAND_COLOR = '#6495ED';
const BRAND_BG_LIGHT = '#F0F5FE';
const BRAND_BORDER = '#D6E4FF';

const QUICK_ACTIONS = [
  {id: 'Attendance', label: 'Attendance', icon: 'calendar-outline'},
  {id: 'Results', label: 'Results', icon: 'stats-chart-outline'},
  {
    id: 'DetailedResult',
    label: 'Detailed Result',
    icon: 'document-text-outline',
  },
  {id: 'Classroom', label: 'Classroom', icon: 'people-outline'},
];

const TDashboard = () => {
  const navigation = useNavigation();
  const {userData} = useAuth();

  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [instituteInfo, setInstituteInfo] = useState(null);

  useEffect(() => {
    if (!userData?.email) return;
    loadAll(userData.email, userData.instituteEmail);
  }, [userData]);

  const loadAll = async (email, instituteEmail) => {
    try {
      setLoading(true);
      const resolvedInstituteEmail = instituteEmail || 'Testing@gmail.com';

      const [classData, instituteData] = await Promise.all([
        fetchClassroomByTeacher(email).catch(() => []),
        getInstituteDetailsApi(resolvedInstituteEmail).catch(() => null),
      ]);
      setClassrooms(classData || []);
      setInstituteInfo(instituteData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (!userData?.email) return;
    setRefreshing(true);
    loadAll(userData.email, userData.instituteEmail);
  };

  const navigateTo = (screenName, params = {}) => {
    try {
      const target =
        screenName === 'DetailedResult'
          ? {
              screen: 'Results',
              params: {initialTab: 'DetailedResult', ...params},
            }
          : {screen: screenName, params};

      const parent = navigation.getParent?.();
      if (parent?.dispatch) {
        const {CommonActions} = require('@react-navigation/native');
        parent.dispatch(
          CommonActions.navigate({
            name: 'TeacherDashboard',
            params: target,
          }),
        );
      } else {
        navigation.navigate(target.screen, target.params);
      }
    } catch (e) {
      console.warn('Navigation failed:', e);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = userData?.name?.split(' ')[0] || 'Teacher';
  const uniqueCoursesCount = [
    ...new Set(classrooms.map(c => c.course?.coursename).filter(Boolean)),
  ].length;

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

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
        {/* ── Compact Profile Header Card ──────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileLeft}>
              {instituteInfo?.instituteImage ? (
                <Image
                  source={{uri: instituteInfo.instituteImage}}
                  style={styles.instituteLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.instituteLogoFallback}>
                  <Text style={styles.instituteLogoLetter}>
                    {(instituteInfo?.instituteName || 'I')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.greetingText}>{getGreeting()},</Text>
                <Text style={styles.teacherName}>
                  {userData?.name || 'Teacher'}
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

          {instituteInfo && (
            <View style={styles.metaRow}>
              <Ionicons name="business-outline" size={13} color="#64748B" />
              <Text style={styles.metaText} numberOfLines={1}>
                {instituteInfo.instituteName}
                {instituteInfo.address ? `  ·  ${instituteInfo.address}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── Compact Stats Summary ────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{classrooms.length}</Text>
            <Text style={styles.statLabel}>Total Batches</Text>
          </View>

          <View style={[styles.statBox, styles.statBoxBorder]}>
            <Text style={styles.statValue}>{uniqueCoursesCount}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
            <Text style={styles.statLabel}>System Status</Text>
          </View>
        </View>

        {/* ── Quick Actions ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => navigateTo(action.id)}>
              <View style={styles.quickIconWrapper}>
                <Ionicons name={action.icon} size={18} color={BRAND_COLOR} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Batches Header ───────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY BATCHES</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{classrooms.length}</Text>
          </View>
        </View>

        {/* ── Compact Batch Cards ──────────────────────────────────────── */}
        <View style={styles.batchContainer}>
          {classrooms.map(classroom => (
            <TouchableOpacity
              key={classroom.id}
              style={styles.batchCard}
              activeOpacity={0.7}
              onPress={() => navigateTo('Classroom', {classId: classroom.id})}>
              <View style={styles.batchTop}>
                <View style={styles.batchTitleRow}>
                  <Ionicons
                    name="folder-open-outline"
                    size={15}
                    color={BRAND_COLOR}
                  />
                  <Text style={styles.batchName} numberOfLines={1}>
                    {classroom.batchName}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
              </View>

              <View style={styles.batchDivider} />

              <View style={styles.batchBottom}>
                <View style={styles.batchInfoCol}>
                  <Text style={styles.infoLabel}>COURSE</Text>
                  <Text style={styles.infoVal} numberOfLines={1}>
                    {classroom.course?.coursename || '—'}
                  </Text>
                </View>

                <View style={styles.batchInfoColRight}>
                  <Text style={styles.infoLabel}>YEAR</Text>
                  <View style={styles.yearTag}>
                    <Text style={styles.yearText}>
                      {classroom.academicYear || '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Empty State ─────────────────────────────────────────────── */}
        {classrooms.length === 0 && !loading && (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Assigned Batches</Text>
            <Text style={styles.emptySub}>
              There are currently no active batches linked to this account.
            </Text>
          </View>
        )}

        {/* ── Loading State ────────────────────────────────────────────── */}
        {loading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptySub}>Fetching latest data...</Text>
          </View>
        )}
      </ScrollView>

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default TDashboard;

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

  /* Compact Profile Header */
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
    marginBottom: 8,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  instituteLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  instituteLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: BRAND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instituteLogoLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
  },
  greetingText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'DMSans-Regular',
  },
  teacherName: {
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'DMSans-Medium',
    flex: 1,
  },

  /* Stats Bar */
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1F5F9',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'DMSans-Medium',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 10,
    color: '#15803D',
    fontFamily: 'DMSans-Bold',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'DMSans-Bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  badgeCount: {
    backgroundColor: BRAND_BG_LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND_BORDER,
  },
  badgeCountText: {
    fontSize: 9,
    fontFamily: 'DMSans-Bold',
    color: BRAND_COLOR,
  },

  /* Quick Actions Grid */
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quickCard: {
    width: '48.8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: BRAND_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: '#1E293B',
  },

  /* Batch Cards */
  batchContainer: {
    gap: 8,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  batchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  batchName: {
    fontSize: 13,
    fontFamily: 'DMSans-Bold',
    color: '#0F172A',
    flex: 1,
  },
  batchDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  batchBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchInfoCol: {
    flex: 1,
  },
  batchInfoColRight: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: 'DMSans-Bold',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: '#334155',
  },
  yearTag: {
    backgroundColor: BRAND_BG_LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BRAND_BORDER,
  },
  yearText: {
    fontSize: 10,
    fontFamily: 'DMSans-Bold',
    color: BRAND_COLOR,
  },

  /* Empty / Loading Card */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
    color: '#334155',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
});
