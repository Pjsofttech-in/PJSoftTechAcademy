import React, {useEffect, useState, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRoute} from '@react-navigation/native';
import {useAuth} from '../../auth/AuthContext';
import {fetchStudentsByClass} from '../../util/Apicall';

// ── HELPERS ──
const fmtDate = d => (d ? d.split('-').reverse().join('/') : '—');

const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');

const AVATAR_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#6366f1',
];

const avatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// ── STUDENT CARD ──
const StudentCard = ({item, srNo}) => {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Correct JSON Key Mapping
  const name = item.name || item.studentName || 'N/A';
  const mobile = item.mobile1 || item.mobileNo || '—';
  const course =
    item.coursename ||
    item.courseName ||
    item.admissionClassRoom?.course?.coursename ||
    '—';
  const medium =
    item.mediumName ||
    item.medium ||
    item.admissionClassRoom?.medium?.mediumName ||
    '—';
  const duration = item.duration || '—';
  const academicYear = item.academicYear || '—';
  const admissionDate = item.date || item.admissionDate;
  const email = item.email || '—';
  const rollNo = item.rollNo;
  const imageUri = item.studentImage;

  // Extract subjects from admissionClassRoom safely
  const rawSubjects = item.admissionClassRoom?.subjects || [];
  const subjectsText =
    Array.isArray(rawSubjects) && rawSubjects.length > 0
      ? rawSubjects.map(s => s.subjectName).join(', ')
      : '—';

  const color = avatarColor(name);

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.card, expanded && styles.cardExpanded]}>
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrapper}>
            {imageUri && !imgError ? (
              <Image
                source={{uri: imageUri}}
                style={styles.avatarCircle}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={[styles.avatarCircle, {backgroundColor: color}]}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardHeaderInfo}>
            <View style={styles.nameDateRow}>
              <Text style={styles.studentName} numberOfLines={1}>
                {name}
              </Text>
              {rollNo ? (
                <View style={styles.rollPill}>
                  <Icon name="badge" size={10} color="#64748b" />
                  <Text style={styles.rollPillText}>Roll: {rollNo}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.courseBadge}>
                <Icon
                  name="school"
                  size={10}
                  color="#3b82f6"
                  style={{marginRight: 3}}
                />
                <Text style={styles.courseBadgeText} numberOfLines={1}>
                  {course}
                </Text>
              </View>
              {academicYear !== '—' && (
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{academicYear}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.expandIconWrap}
            onPress={() => setExpanded(prev => !prev)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <View style={styles.expandCircle}>
              <Icon
                name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={22}
                color="#1e293b"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Summary Grid */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Mobile</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {mobile}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {duration}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Medium</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {medium}
            </Text>
          </View>
        </View>

        {/* Info Strip */}
        <View style={styles.infoStrip}>
          <View style={styles.infoStripItem}>
            <Icon name="event" size={12} color="#6366f1" />
            <Text style={styles.infoStripLabel}> Admitted: </Text>
            <Text style={styles.infoStripValue}>{fmtDate(admissionDate)}</Text>
          </View>
          {email !== '—' && (
            <>
              <View style={styles.infoStripDot} />
              <View style={styles.infoStripItem}>
                <Icon name="email" size={12} color="#10b981" />
                <Text style={styles.infoStripValue} numberOfLines={1}>
                  {' '}
                  {email}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Collapsible Expanded Details */}
        {expanded && (
          <View style={styles.expandedSection}>
            <Text style={styles.expandedSectionTitle}>Full Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Roll No</Text>
                  <Text style={styles.detailValue}>{rollNo || '—'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Mobile</Text>
                  <Text style={styles.detailValue}>{mobile}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Admission Date</Text>
                  <Text style={styles.detailValue}>
                    {fmtDate(admissionDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Course</Text>
                  <Text style={styles.detailValue}>{course}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{duration}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Medium</Text>
                  <Text style={styles.detailValue}>{medium}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Academic Year</Text>
                  <Text style={styles.detailValue}>{academicYear}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={[styles.detailItem, {flex: 1}]}>
                  <Text style={styles.detailLabel}>Subjects</Text>
                  <Text style={styles.detailValue}>{subjectsText}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// ── MAIN SCREEN ──
const StudentList = () => {
  const {userData} = useAuth();
  const route = useRoute();

  const classroom = route.params?.classroom;
  const classId = classroom?.id;

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const loadStudents = useCallback(
    async (isRefresh = false) => {
      if (!classId || !userData?.email) return;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const data = await fetchStudentsByClass({
          classId,
          role:
            userData?.role === 'staff'
              ? 'teacher'
              : userData?.role || 'teacher',
          email: userData.email,
        });
        setStudents(data || []);
        setFiltered(data || []);
      } catch (err) {
        console.error('❌ [StudentList] Error:', err);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [classId, userData?.email, userData?.role],
  );

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(students);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      students.filter(s => {
        const name = (s.name || s.studentName || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const roll = String(s.rollNo || '').toLowerCase();
        const mobile = String(s.mobile1 || s.mobileNo || '').toLowerCase();
        const course = (s.coursename || s.courseName || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          roll.includes(q) ||
          mobile.includes(q) ||
          course.includes(q)
        );
      }),
    );
  }, [search, students]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading Students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadStudents()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Students</Text>
          {classroom?.batchName && (
            <Text style={styles.screenSubtitle}>{classroom.batchName}</Text>
          )}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={18}
          color="#94a3b8"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, roll no, mobile, course…"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.centeredState}>
          <Icon name="people-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {search
              ? 'No students match your search.'
              : 'No students found for this class.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          renderItem={({item, index}) => (
            <StudentCard item={item} srNo={index + 1} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadStudents(true)}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default StudentList;

// ── STYLES ──
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f1f5f9'},
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  screenTitle: {fontSize: 18, fontWeight: '800', color: '#1e293b'},
  screenSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {marginRight: 8},
  searchInput: {flex: 1, fontSize: 13, color: '#1e293b', paddingVertical: 0},
  listContent: {paddingTop: 8, paddingBottom: 20, paddingHorizontal: 12},
  cardWrapper: {marginBottom: 10},
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardExpanded: {shadowOpacity: 0.12, elevation: 5},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  avatarWrapper: {alignItems: 'center', marginRight: 10},
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {color: '#fff', fontSize: 14, fontWeight: '700'},
  cardHeaderInfo: {flex: 1, marginRight: 4},
  nameDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flexShrink: 1,
  },
  rollPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  rollPillText: {fontSize: 10, color: '#64748b', fontWeight: '500'},
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  courseBadgeText: {fontSize: 10, color: '#1d4ed8', fontWeight: '600'},
  yearBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  yearBadgeText: {fontSize: 10, color: '#065f46', fontWeight: '600'},
  expandIconWrap: {marginLeft: 'auto'},
  expandCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryBox: {flex: 1, alignItems: 'center'},
  summaryDivider: {width: 1, backgroundColor: '#e2e8f0', marginVertical: 2},
  summaryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
    gap: 4,
  },
  infoStripItem: {flexDirection: 'row', alignItems: 'center'},
  infoStripLabel: {fontSize: 11, color: '#94a3b8', fontWeight: '500'},
  infoStripValue: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    flexShrink: 1,
  },
  infoStripDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  expandedSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  detailsGrid: {gap: 2},
  detailRow: {flexDirection: 'row', marginBottom: 8, gap: 8},
  detailItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  detailValue: {fontSize: 12, color: '#1e293b', fontWeight: '600'},
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: {fontSize: 14, color: '#64748b', fontWeight: '500'},
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '400',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  retryBtnText: {color: '#fff', fontWeight: '700', fontSize: 13},
});
