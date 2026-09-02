import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {
  fetchStudentResultsByTeacher,
  fetchTopicNamesByTeacher,
} from '../../../util/Apicall';
import AnimatedDropdownField from '../../../components/AnimatedDropdownField';
import {useAuth} from '../../../auth/AuthContext';
import ExamPaperTypeSelector from '../../../components/ExamPaperTypeSelector';
import {useRoute, useNavigation} from '@react-navigation/native';
import debounce from 'lodash.debounce';
import {
  Search,
  SlidersHorizontal,
  User,
  Award,
  BookOpen,
  Layers,
  Percent,
  X,
} from 'lucide-react-native';

// ─── Status Badge Styling ────────────────────────────────────────────────────

const getStatusStyle = status => {
  const s = (status || '').toLowerCase();
  if (s === 'pass') {
    return {bg: '#E6F4EA', color: '#1E7F43', border: '#A7F3D0'};
  }
  if (s === 'fail') {
    return {bg: '#FDECEC', color: '#B42318', border: '#FECACA'};
  }
  return {bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0'};
};

// ─── Student Card Component ───────────────────────────────────────────────────

const StudentCard = React.memo(({item, onPress}) => {
  const statusStyle = getStatusStyle(item.status);

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <User size={18} color="#6366F1" strokeWidth={2.2} />
        </View>

        <TouchableOpacity
          style={styles.studentNameWrap}
          onPress={() => onPress(item.studentId)}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.studentName || 'N/A'}
          </Text>
          <Text style={styles.studentIdText}>ID: {item.studentId || '--'}</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusStyle.bg,
              borderColor: statusStyle.border,
            },
          ]}>
          <Text style={[styles.statusText, {color: statusStyle.color}]}>
            {item.status || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      {/* Grid Details */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <BookOpen size={11} color="#64748B" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Course</Text>
          </View>
          <Text style={styles.infoCellValue} numberOfLines={1}>
            {item.coursename || '--'}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <Layers size={11} color="#64748B" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Batch / Medium</Text>
          </View>
          <Text style={styles.infoCellValue} numberOfLines={1}>
            {item.batchName || '--'} ({item.mediumName || '--'})
          </Text>
        </View>

        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <Award size={11} color="#6366F1" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Marks (Obt / Total)</Text>
          </View>
          <Text style={styles.infoCellValue}>
            {item.totalObtainedMarks ?? '--'} / {item.totalSubjectMarks ?? '--'}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <View style={styles.infoCellHeader}>
            <Percent size={11} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.infoCellLabel}>Percentage</Text>
          </View>
          <Text style={[styles.infoCellValue, {color: '#6366F1'}]}>
            {item.percentage != null
              ? `${Number(item.percentage).toFixed(2)}%`
              : '--'}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

const Result = () => {
  const navigation = useNavigation();
  const {userData} = useAuth();
  const route = useRoute();

  const [searchText, setSearchText] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Dropdown States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedMedium, setSelectedMedium] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [selectedPaperType, setSelectedPaperType] = useState(null);

  const [courses, setCourses] = useState([]);
  const [mediumList, setMediumList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const {
    classroomId,
    subjectId,
    topicName: assignedTopicName,
    fromAssignment,
  } = route.params || {};

  // Debounced Search Handler
  const debouncedSetSelectedName = useCallback(
    debounce(text => {
      setSelectedName(text);
    }, 300),
    [],
  );

  const handleSearchChange = text => {
    setSearchText(text);
    debouncedSetSelectedName(text);
  };

  const handleStudentPress = useCallback(
    studentId => {
      navigation.navigate('StudentMarksheet', {studentId});
    },
    [navigation],
  );

  // Data Fetching
  const loadResults = useCallback(async () => {
    if (!userData?.email || !userData.branchCode) return;
    try {
      setLoading(true);
      const resultData = await fetchStudentResultsByTeacher(
        'teacher',
        userData.email,
        userData.branchCode,
      );

      setStudentResults(resultData || []);

      const courseSet = new Set();
      const mediumSet = new Set();
      const batchSet = new Set();
      const academicYearSet = new Set();

      (resultData || []).forEach(item => {
        if (item.coursename) courseSet.add(item.coursename);
        if (item.mediumName) mediumSet.add(item.mediumName);
        if (item.batchName) batchSet.add(item.batchName);
        if (item.academicYear) academicYearSet.add(item.academicYear);
      });

      setCourses([...courseSet]);
      setMediumList([...mediumSet]);
      setBatchList([...batchSet]);
      setAcademicYears([...academicYearSet]);
    } catch (error) {
      console.error('Failed to load student results:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadResults();
  }, [loadResults]);

  // Topic Syncing from Assignments
  useEffect(() => {
    const loadTopicsFromAssignment = async () => {
      if (
        fromAssignment &&
        classroomId &&
        subjectId &&
        selectedExamType?.id &&
        selectedPaperType?.id
      ) {
        try {
          await fetchTopicNamesByTeacher({
            classroomId,
            subjectId,
            examTypeId: selectedExamType.id,
            paperTypeId: selectedPaperType.id,
            email: userData.email,
          });
        } catch (error) {
          console.error('Failed to fetch topic names:', error.message);
        }
      }
    };

    loadTopicsFromAssignment();
  }, [
    fromAssignment,
    classroomId,
    subjectId,
    selectedExamType?.id,
    selectedPaperType?.id,
    userData?.email,
  ]);

  const handleApplyFilter = () => {
    if (
      !selectedExamType?.id ||
      selectedExamType.id === 'all' ||
      !selectedPaperType?.id ||
      selectedPaperType.id === 'all'
    ) {
      Alert.alert('Missing Fields', 'Please select both Exam and Paper Type');
      return;
    }
    setFilterVisible(false);
  };

  const handleResetFilter = () => {
    setSelectedAcademicYear(null);
    setSelectedCourse(null);
    setSelectedMedium(null);
    setSelectedBatch(null);
    setSelectedName('');
    setSearchText('');
    setFilterVisible(false);
  };

  const filteredResults = useMemo(() => {
    return studentResults.filter(item => {
      const name = item?.studentName?.toLowerCase() || '';
      const input = selectedName.trim().toLowerCase();

      const academicYearMatch = selectedAcademicYear
        ? item.academicYears === selectedAcademicYear
        : true;
      const courseMatch = selectedCourse
        ? item.coursename === selectedCourse
        : true;
      const mediumMatch = selectedMedium
        ? item.mediumName === selectedMedium
        : true;
      const batchMatch = selectedBatch
        ? item.batchName === selectedBatch
        : true;
      const nameMatch = name.includes(input);

      return (
        academicYearMatch &&
        courseMatch &&
        mediumMatch &&
        batchMatch &&
        nameMatch
      );
    });
  }, [
    studentResults,
    selectedName,
    selectedAcademicYear,
    selectedCourse,
    selectedMedium,
    selectedBatch,
  ]);

  const renderItem = useCallback(
    ({item}) => <StudentCard item={item} onPress={handleStudentPress} />,
    [handleStudentPress],
  );

  const keyExtractor = useCallback(
    (item, index) => (item.studentId ? String(item.studentId) : String(index)),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Search & Filter Control Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchInputBox}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name..."
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}>
          <SlidersHorizontal size={18} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterVisible(false)}>
          <Pressable style={styles.popupContainer} onPress={() => {}}>
            <Text style={styles.popupTitle}>Filter Results</Text>

            {[
              {
                label: 'Academic Year',
                list: academicYears,
                selected: selectedAcademicYear,
                setter: setSelectedAcademicYear,
              },
              {
                label: 'Course',
                list: courses,
                selected: selectedCourse,
                setter: setSelectedCourse,
              },
              {
                label: 'Medium',
                list: mediumList,
                selected: selectedMedium,
                setter: setSelectedMedium,
              },
              {
                label: 'Batch',
                list: batchList,
                selected: selectedBatch,
                setter: setSelectedBatch,
              },
            ].map(({label, list, selected, setter}, idx) => (
              <AnimatedDropdownField
                key={idx}
                label={label}
                options={list}
                selected={selected}
                onSelect={setter}
              />
            ))}

            {userData?.email && userData?.role && userData?.branchCode ? (
              <ExamPaperTypeSelector
                userData={userData}
                onExamTypeChange={setSelectedExamType}
                onPaperTypeChange={setSelectedPaperType}
              />
            ) : (
              <ActivityIndicator size="small" color="#6366F1" />
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnReset]}
                onPress={handleResetFilter}>
                <Text style={styles.modalBtnTextReset}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnApply]}
                onPress={handleApplyFilter}>
                <Text style={styles.modalBtnTextApply}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Results Listing */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366F1']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Award size={36} color="#94A3B8" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No student results found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Result;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0,
  },
  filterButton: {
    width: 42,
    height: 42,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 4,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifycontent: 'center',
    alignItems: 'center',
  },
  studentNameWrap: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  studentIdText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoCell: {
    width: '50%',
    paddingVertical: 4,
  },
  infoCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  infoCellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoCellValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnReset: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnApply: {
    backgroundColor: '#6366F1',
  },
  modalBtnTextReset: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBtnTextApply: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
