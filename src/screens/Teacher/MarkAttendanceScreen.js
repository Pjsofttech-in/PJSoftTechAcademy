import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {User, UserX, ClipboardCheck} from 'lucide-react-native';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {
  fetchAttendanceDataByTeacher,
  submitManualAttendance,
} from '../../util/Apicall';

const MarkAttendanceScreen = ({route, navigation}) => {
  const {classroomId, branchCode, batchName} = route.params;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!classroomId || !branchCode) return;
    try {
      setLoading(true);
      const res = await fetchAttendanceDataByTeacher({
        classroomId,
        branchCode,
        filter: 'today',
        status: 'absent',
      });
      const data = res?.absentData ?? [];
      setStudents(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classroomId, branchCode]);

  const toggleMarkAttendance = rollno => {
    setMarkedAttendance(prev => ({
      ...prev,
      [rollno]: !prev[rollno],
    }));
  };

  const selectAll = () => {
    const allMarked = students.every(s => markedAttendance[s.rollno]);
    if (allMarked) {
      setMarkedAttendance({});
    } else {
      const all = {};
      students.forEach(s => {
        all[s.rollno] = true;
      });
      setMarkedAttendance(all);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSubmitAttendance = async () => {
    const selectedRollNos = students
      .filter(student => markedAttendance[student.rollno])
      .map(student => student.rollno);

    if (selectedRollNos.length === 0) {
      Alert.alert(
        'No students selected',
        'Please select at least one student.',
      );
      return;
    }

    try {
      const res = await submitManualAttendance({
        classroomId,
        branchCode,
        rollNumbers: selectedRollNos,
      });
      Alert.alert('Success', res?.message || 'Attendance marked successfully!');
      setMarkedAttendance({});
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance. Please try again.');
      console.error('Error submitting attendance:', error);
    }
  };

  const selectedCount = students.filter(s => markedAttendance[s.rollno]).length;
  const allSelected =
    students.length > 0 && students.every(s => markedAttendance[s.rollno]);

  const renderStudentCard = ({item, index}) => {
    const isChecked = !!markedAttendance[item.rollno];

    return (
      <Pressable
        onPress={() => toggleMarkAttendance(item.rollno)}
        style={({pressed}) => [
          styles.studentCard,
          isChecked && styles.studentCardChecked,
          pressed && styles.studentCardPressed,
        ]}>
        {/* Left accent bar */}
        <View
          style={[styles.cardAccent, isChecked && styles.cardAccentChecked]}
        />

        {/* Avatar */}
        <View
          style={[
            styles.avatarCircle,
            isChecked && styles.avatarCircleChecked,
          ]}>
          <User
            size={18}
            color={isChecked ? '#fff' : '#268cd5'}
            strokeWidth={2}
          />
        </View>

        {/* Info */}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.studentName ?? 'N/A'}
          </Text>
          <View style={styles.rollNoRow}>
            <Ionicons name="id-card-outline" size={11} color="#94a3b8" />
            <Text style={styles.rollNoText}>
              Roll No: {item.rollno ?? 'N/A'}
            </Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{item.loginStatus ?? 'Absent'}</Text>
        </View>

        {/* Checkbox */}
        <View
          style={[
            styles.checkboxWrap,
            isChecked && styles.checkboxWrapChecked,
          ]}>
          <Ionicons
            name={isChecked ? 'checkmark' : ''}
            size={14}
            color="#fff"
          />
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <UserX size={32} color="#94a3b8" strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>All Present!</Text>
      <Text style={styles.emptySubtitle}>
        No absent students found for today.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TeacherHeader />

      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.pageHeaderContent}>
          <Text style={styles.pageTitle}>Mark Attendance</Text>
          <Text style={styles.pageSubtitle}>{batchName}</Text>
        </View>
        <View style={styles.pageHeaderIcon}>
          <ClipboardCheck size={20} color="#268cd5" strokeWidth={2} />
        </View>
      </View>

      {/* ── Summary strip ── */}
      {!loading && students.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{students.length}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, {color: '#22c55e'}]}>
              {selectedCount}
            </Text>
            <Text style={styles.summaryLabel}>Selected</Text>
          </View>
          <View style={styles.summaryDivider} />
          <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
            <Ionicons
              name={allSelected ? 'checkbox' : 'square-outline'}
              size={16}
              color={allSelected ? '#22c55e' : '#64748b'}
            />
            <Text
              style={[styles.selectAllText, allSelected && {color: '#22c55e'}]}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#268cd5" />
          <Text style={styles.loadingText}>Loading students…</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item, index) => `${item.rollno ?? index}`}
          renderItem={renderStudentCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              colors={['#268cd5']}
              tintColor="#268cd5"
            />
          }
        />
      )}

      {/* ── Footer Buttons ── */}
      {!loading && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}>
            <Ionicons name="close-outline" size={16} color="#64748b" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedCount === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAttendance}
            activeOpacity={0.85}
            disabled={selectedCount === 0}>
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.submitButtonText}>
              Mark Present{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TeacherFooter />
    </View>
  );
};

export default MarkAttendanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(231, 241, 253, 1)',
  },

  // ── Page Header ──────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pageHeaderContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#1e293b',
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#64748b',
    marginTop: 1,
  },
  pageHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // ── Summary Strip ─────────────────────────────────
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  summaryItem: {
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  summaryNumber: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#EF4444',
    lineHeight: 22,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  selectAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#64748b',
  },

  // ── List ─────────────────────────────────────────
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexGrow: 1,
  },

  // ── Student Card ──────────────────────────────────
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 8,
    paddingRight: 14,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  studentCardChecked: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  studentCardPressed: {
    opacity: 0.85,
  },
  cardAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#FDECEC',
    marginRight: 12,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardAccentChecked: {
    backgroundColor: '#22c55e',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarCircleChecked: {
    backgroundColor: '#22c55e',
  },
  studentInfo: {
    flex: 1,
    gap: 3,
  },
  studentName: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
  },
  rollNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rollNoText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    marginRight: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#B42318',
    textTransform: 'capitalize',
  },

  // Checkbox
  checkboxWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxWrapChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },

  // ── Empty ─────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // ── Loading ───────────────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },

  // ── Buttons ───────────────────────────────────────
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(231, 241, 253, 1)',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cancelButtonText: {
    color: '#64748b',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#86efac',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
});
