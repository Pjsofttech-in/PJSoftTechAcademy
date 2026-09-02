import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fetchClassroomByTeacher} from '../../../util/Apicall';
import {useAuth} from '../../../auth/AuthContext';

const TeacherProfile = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [teacher, setTeacher] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const {userData} = useAuth();

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        if (!userData?.email) throw new Error('No auth token found');

        const classroomData = await fetchClassroomByTeacher(userData.email);
        setClassrooms(classroomData || []);

        const allTeachers = classroomData.flatMap(item => item.teachers || []);
        const currentTeacher = allTeachers.find(
          t => t.email?.toLowerCase() === userData.email?.toLowerCase(),
        );

        setTeacher(currentTeacher);
      } catch (error) {
        console.error('Failed to load teacher profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [userData]);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    Clipboard.setString(String(text));
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  const formatTime = timeStr => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, {paddingTop: insets.top + 10}]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </View>
    );
  }

  if (!teacher) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, {paddingTop: insets.top + 10}]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Unable to load profile</Text>
        </View>
      </View>
    );
  }

  // Calculated Summary Metrics
  const totalClassrooms = classrooms.length;
  const allSubjects = classrooms.flatMap(c => c.subjects || []);
  const uniqueSubjects = [...new Map(allSubjects.map(s => [s.id, s])).values()];

  return (
    <View style={styles.container}>
      {/* Dynamic Top Padding Header for Edge-to-Edge */}
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + 24},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Compact Hero Card */}
        <View style={styles.compactHeroCard}>
          <View style={styles.heroRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {teacher.teacherName
                    ? teacher.teacherName.charAt(0).toUpperCase()
                    : 'T'}
                </Text>
              </View>
              <View style={styles.activeDot} />
            </View>

            <View style={styles.heroMainInfo}>
              <Text style={styles.teacherName} numberOfLines={1}>
                {teacher.teacherName}
              </Text>

              {/* Teacher ID with Copy Icon */}
              <View style={styles.idRow}>
                <Text style={styles.idSubText}>
                  ID: <Text style={styles.idValue}>{teacher.id}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(teacher.id, 'Teacher ID')}
                  style={styles.copyIconBtn}>
                  <Ionicons name="copy-outline" size={14} color="#6366F1" />
                </TouchableOpacity>
              </View>

              <View style={styles.badgeRow}>
                {teacher.role && (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>
                      {teacher.role.toUpperCase()}
                    </Text>
                  </View>
                )}
                {teacher.branchCode && (
                  <View style={[styles.tagPill, styles.branchPill]}>
                    <Text style={styles.branchPillText}>
                      {teacher.branchCode}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Summary Metric Grid */}
        <View style={styles.gridRow}>
          {/* Classrooms Metric Card */}
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.cardHeaderSmall}>
              <Ionicons name="easel-outline" size={16} color="#6366F1" />
              <Text style={styles.gridTitle}>Classrooms</Text>
            </View>
            <Text style={styles.metricHighlight}>{totalClassrooms}</Text>
            <Text style={styles.metricSubText}>Assigned Batches</Text>
          </View>

          {/* Subjects Metric Card */}
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.cardHeaderSmall}>
              <Ionicons name="book-outline" size={16} color="#6366F1" />
              <Text style={styles.gridTitle}>Subjects</Text>
            </View>
            <Text style={styles.metricHighlight}>{uniqueSubjects.length}</Text>
            <Text style={styles.metricSubText}>Active Subjects</Text>
          </View>
        </View>

        {/* Account Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="mail-outline"
              size={16}
              color="#64748b"
              style={styles.rowIcon}
            />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{teacher.email}</Text>
          </View>

          {teacher.createdByEmail && (
            <View style={styles.infoRow}>
              <Ionicons
                name="person-add-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Created By:</Text>
              <Text style={styles.infoValue}>{teacher.createdByEmail}</Text>
            </View>
          )}

          {teacher.branchCode && (
            <View style={styles.infoRow}>
              <Ionicons
                name="business-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Branch Code:</Text>
              <Text style={styles.infoValue}>{teacher.branchCode}</Text>
            </View>
          )}
        </View>

        {/* Assigned Classrooms List Section */}
        {classrooms.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionHeaderTitle}>Assigned Batches</Text>

            {classrooms.map((cls, index) => (
              <View key={cls.id || index} style={styles.classroomItem}>
                {index > 0 && <View style={styles.divider} />}

                <View style={styles.classroomHeader}>
                  <Text style={styles.batchName}>{cls.batchName}</Text>
                  {cls.academicYear && (
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeText}>
                        {cls.academicYear}
                      </Text>
                    </View>
                  )}
                </View>

                {cls.batchStartTime && cls.batchEndTime && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color="#64748b"
                      style={styles.rowIcon}
                    />
                    <Text style={styles.infoLabel}>Timings:</Text>
                    <Text style={styles.infoValue}>
                      {formatTime(cls.batchStartTime)} -{' '}
                      {formatTime(cls.batchEndTime)}
                    </Text>
                  </View>
                )}

                {cls.course?.coursename && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="school-outline"
                      size={15}
                      color="#64748b"
                      style={styles.rowIcon}
                    />
                    <Text style={styles.infoLabel}>Course:</Text>
                    <Text style={styles.infoValue}>
                      {cls.course.coursename}
                    </Text>
                  </View>
                )}

                {cls.medium?.mediumName && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="language-outline"
                      size={15}
                      color="#64748b"
                      style={styles.rowIcon}
                    />
                    <Text style={styles.infoLabel}>Medium:</Text>
                    <Text style={styles.infoValue}>
                      {cls.medium.mediumName}
                    </Text>
                  </View>
                )}

                {cls.subjects && cls.subjects.length > 0 && (
                  <View style={styles.subjectContainer}>
                    <Text style={styles.subjectLabel}>Subjects:</Text>
                    <View style={styles.chipList}>
                      {cls.subjects.map((sub, i) => (
                        <View key={sub.id || i} style={styles.miniChip}>
                          <Text style={styles.miniChipText}>
                            {sub.subjectName}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#ef4444',
  },

  /* Compact Hero Card */
  compactHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  heroMainInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  idSubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  idValue: {
    color: '#1e293b',
    fontWeight: '700',
  },
  copyIconBtn: {
    marginLeft: 6,
    padding: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '700',
  },
  branchPill: {
    backgroundColor: '#e0f2fe',
  },
  branchPillText: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: '700',
  },

  /* Metric Grid */
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    marginBottom: 0,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metricHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366F1',
  },
  metricSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  /* Standard Card */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 90,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },

  /* Classroom Item Details */
  classroomItem: {
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  classroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  yearBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yearBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subjectLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 90,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  miniChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniChipText: {
    fontSize: 10,
    color: '#4338ca',
    fontWeight: '600',
  },
});

export default TeacherProfile;
