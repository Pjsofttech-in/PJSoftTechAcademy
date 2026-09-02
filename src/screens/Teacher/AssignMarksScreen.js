// src/screens/Teacher/AssignMarksScreen.js
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../auth/AuthContext';
import {
  createClassroomSubjectDetails,
  fetchAllClassRoomSubjectDetails,
  updateClassRoomSubjectDetailsApi,
} from '../../util/Apicall';
import ExamPaperTypeSelector from '../../components/ExamPaperTypeSelector';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// SKELETON LOADER COMPONENT
// ─────────────────────────────────────────────────────────────

const SkeletonCard = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.skeletonCard, {opacity: pulseAnim}]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={{flex: 1, gap: 6}}>
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineShort} />
        </View>
      </View>
      <View style={styles.skeletonGrid}>
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
// MARKS CARD WITH DUAL METADATA GRIDS
// ─────────────────────────────────────────────────────────────

const MarkCard = ({item, index, onEdit}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY, index]);

  const subjectName = item.subject?.subjectName || '-';
  const topicName = item.topicName || 'General Topic';
  const courseName =
    item.classroom?.course?.coursename || item.classroom?.courseName || '-';
  const batchName =
    item.classroom?.batchName || item.classroom?.classroom?.batchName || '-';
  const examTypeName = item.examType?.examType || '-';
  const paperTypeName = item.paperType?.paperType || '-';

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{translateY}],
        },
      ]}>
      {/* CARD TOP HEADER ROW */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.classIconBadge}>
            <Ionicons name="journal-outline" size={18} color="#6366F1" />
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.batchName} numberOfLines={1}>
              {subjectName}
            </Text>
            <Text style={styles.courseNameText} numberOfLines={1}>
              Topic: {topicName}
            </Text>
          </View>
        </View>

        {/* INLINE EDIT ACTION */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.inlineAssignBtn}
          onPress={() => onEdit(item)}>
          <Ionicons name="pencil-outline" size={12} color="#4F46E5" />
          <Text style={styles.inlineAssignText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* 2x2 CONFIGURATION DETAILS GRID */}
      <View style={styles.configGridContainer}>
        <View style={styles.configGridRow}>
          <View style={styles.configGridCell}>
            <Ionicons name="book-outline" size={12} color="#0284C7" />
            <Text style={styles.configLabel}>COURSE:</Text>
            <Text style={styles.configValue} numberOfLines={1}>
              {courseName}
            </Text>
          </View>

          <View style={styles.configGridDivider} />

          <View style={styles.configGridCell}>
            <Ionicons name="school-outline" size={12} color="#059669" />
            <Text style={styles.configLabel}>BATCH:</Text>
            <Text style={styles.configValue} numberOfLines={1}>
              {batchName}
            </Text>
          </View>
        </View>

        <View style={styles.configRowDivider} />

        <View style={styles.configGridRow}>
          <View style={styles.configGridCell}>
            <Ionicons name="ribbon-outline" size={12} color="#D97706" />
            <Text style={styles.configLabel}>EXAM:</Text>
            <Text
              style={[styles.configValue, {color: '#B45309'}]}
              numberOfLines={1}>
              {examTypeName}
            </Text>
          </View>

          <View style={styles.configGridDivider} />

          <View style={styles.configGridCell}>
            <Ionicons name="document-text-outline" size={12} color="#7C3AED" />
            <Text style={styles.configLabel}>PAPER:</Text>
            <Text
              style={[styles.configValue, {color: '#6D28D9'}]}
              numberOfLines={1}>
              {paperTypeName}
            </Text>
          </View>
        </View>
      </View>

      {/* NUMERICAL MARKS STATS GRID */}
      <View style={styles.marksStatsContainer}>
        <View style={styles.markStatBox}>
          <Text style={styles.markStatLabel}>TOTAL MARKS</Text>
          <Text style={[styles.markStatValue, {color: '#4F46E5'}]}>
            {item.totalMarks ?? '-'}
          </Text>
        </View>

        <View style={styles.markStatDivider} />

        <View style={styles.markStatBox}>
          <Text style={styles.markStatLabel}>PASS MARKS</Text>
          <Text style={[styles.markStatValue, {color: '#059669'}]}>
            {item.passingMarks ?? '-'}
          </Text>
        </View>

        <View style={styles.markStatDivider} />

        <View style={styles.markStatBox}>
          <Text style={styles.markStatLabel}>SUBJECT MARKS</Text>
          <Text style={[styles.markStatValue, {color: '#7C3AED'}]}>
            {item.totalSubjectMarks ?? 0}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────

const AssignMarksScreen = ({route}) => {
  const navigation = useNavigation();
  const {userData} = useAuth();
  const classroom = route?.params?.classroom;

  // Data states
  const [assignedMarksList, setAssignedMarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topicName, setTopicName] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [selectedPaperType, setSelectedPaperType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [editTotalMarks, setEditTotalMarks] = useState('');
  const [editPassingMarks, setEditPassingMarks] = useState('');
  const [editExamType, setEditExamType] = useState(null);
  const [editPaperType, setEditPaperType] = useState(null);
  const [editSubject, setEditSubject] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load List
  const loadAssignedMarks = useCallback(async () => {
    try {
      const data = await fetchAllClassRoomSubjectDetails(
        userData.role,
        userData.email,
        userData.branchCode,
      );
      setAssignedMarksList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch assigned marks:', error);
      setAssignedMarksList([]);
    }
  }, [userData]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadAssignedMarks();
      setLoading(false);
    })();
  }, [loadAssignedMarks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignedMarks();
    setRefreshing(false);
  };

  // Create Form Handler
  const handleAssignMarksSubmit = async () => {
    const missing = [
      {value: selectedSubject, name: 'Subject'},
      {value: selectedExamType, name: 'Exam Type'},
      {value: selectedPaperType, name: 'Paper Type'},
      {value: totalMarks, name: 'Total Marks'},
      {value: passingMarks, name: 'Passing Marks'},
    ].filter(f => !f.value);

    if (missing.length > 0) {
      Alert.alert(
        'Missing Fields',
        `Please fill: ${missing.map(f => f.name).join(', ')}`,
      );
      return;
    }

    const totalNum = parseInt(totalMarks, 10);
    const passNum = parseInt(passingMarks, 10);
    if (isNaN(totalNum) || totalNum <= 0) {
      Alert.alert('Validation', 'Total Marks must be a positive number.');
      return;
    }
    if (isNaN(passNum) || passNum <= 0) {
      Alert.alert('Validation', 'Passing Marks must be a positive number.');
      return;
    }
    if (passNum >= totalNum) {
      Alert.alert('Validation', 'Passing Marks must be less than Total Marks.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        classroom: {id: classroom?.id},
        subject: {id: selectedSubject},
        examType: {id: selectedExamType.id},
        paperType: {id: selectedPaperType.id},
        totalMarks: totalNum,
        passingMarks: passNum,
        topicName: topicName.trim() || 'General Topic',
        createdByEmail: userData.email,
        role: userData.role,
        branchCode: userData.branchCode,
      };

      const result = await createClassroomSubjectDetails({
        email: userData.email,
        role: 'teacher',
        data: payload,
        topicName: payload.topicName,
      });

      if (result?.id) {
        await loadAssignedMarks();
        setCreateModalVisible(false);
        resetCreateForm();
      } else {
        Alert.alert('Submission Failed', 'Could not assign marks. Try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedSubject(null);
    setTopicName('');
    setTotalMarks('');
    setPassingMarks('');
    setSelectedExamType(null);
    setSelectedPaperType(null);
  };

  // Edit Form Handler
  const handleOpenEdit = item => {
    setEditingItem(item);
    setEditTopicName(item.topicName || '');
    setEditTotalMarks(String(item.totalMarks ?? ''));
    setEditPassingMarks(String(item.passingMarks ?? ''));
    setEditExamType(item.examType || null);
    setEditPaperType(item.paperType || null);
    setEditSubject(item.subject?.id ?? null);
    setEditModalVisible(true);
  };

  const handleUpdateSubmit = async () => {
    if (!editingItem) return;

    const missing = [
      {value: editSubject, name: 'Subject'},
      {value: editExamType, name: 'Exam Type'},
      {value: editPaperType, name: 'Paper Type'},
      {value: editTotalMarks, name: 'Total Marks'},
      {value: editPassingMarks, name: 'Passing Marks'},
    ].filter(f => !f.value);

    if (missing.length > 0) {
      Alert.alert(
        'Missing Fields',
        `Please fill: ${missing.map(f => f.name).join(', ')}`,
      );
      return;
    }

    const totalNum = parseInt(editTotalMarks, 10);
    const passNum = parseInt(editPassingMarks, 10);
    if (isNaN(totalNum) || totalNum <= 0) {
      Alert.alert('Validation', 'Total Marks must be a positive number.');
      return;
    }
    if (isNaN(passNum) || passNum <= 0) {
      Alert.alert('Validation', 'Passing Marks must be a positive number.');
      return;
    }
    if (passNum >= totalNum) {
      Alert.alert('Validation', 'Passing Marks must be less than Total Marks.');
      return;
    }

    try {
      setIsUpdating(true);

      const payload = {
        classroom: {id: editingItem.classroom?.id ?? classroom?.id},
        subject: {id: editSubject},
        examType: {id: editExamType.id},
        paperType: {id: editPaperType.id},
        totalMarks: totalNum,
        passingMarks: passNum,
        topicName: editTopicName.trim() || 'General Topic',
      };

      await updateClassRoomSubjectDetailsApi(
        editingItem.id,
        userData.role,
        userData.email,
        payload,
      );

      await loadAssignedMarks();
      setEditModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      Alert.alert('Update Failed', error.message || 'Could not update record.');
    } finally {
      setIsUpdating(false);
    }
  };

  const subjects = classroom?.subjects || [];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (assignedMarksList.length === 0) {
      return (
        <View style={styles.centeredState}>
          <Ionicons name="document-text-outline" size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Marks Records Found</Text>
          <Text style={styles.emptySubtext}>
            Tap "+ Assign Marks" above to assign subject marks.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={assignedMarksList}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={({item, index}) => (
          <MarkCard item={item} index={index} onEdit={handleOpenEdit} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

      <View style={styles.content}>
        {/* TOP COMPACT BAR */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}>
              <Ionicons name="chevron-back" size={16} color="#4338CA" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>ASSIGN MARKS</Text>
              {classroom?.batchName && (
                <Text style={styles.screenSubtitle}>{classroom.batchName}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.assignActionBtn}
            activeOpacity={0.75}
            onPress={() => setCreateModalVisible(true)}>
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text style={styles.assignActionBtnText}>Assign Marks</Text>
          </TouchableOpacity>
        </View>

        {/* COUNT INDICATOR ROW */}
        {!loading && assignedMarksList.length > 0 && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {assignedMarksList.length} Subject Record
              {assignedMarksList.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {renderContent()}
      </View>

      {/* CREATE MODAL */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCreateModalVisible(false);
          resetCreateForm();
        }}>
        <View style={styles.dropdownOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <View style={styles.popupHeaderLeft}>
                <View style={styles.classIconBadge}>
                  <Ionicons name="create-outline" size={16} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.popupTitle}>Assign Marks</Text>
                  <Text style={styles.popupSubtitle}>
                    {classroom?.batchName || 'Classroom'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.popupCloseBtn}
                onPress={() => {
                  setCreateModalVisible(false);
                  resetCreateForm();
                }}>
                <Ionicons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.popupScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              
              {/* SUBJECT SELECTOR */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Subject <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedSubject}
                    onValueChange={setSelectedSubject}
                    dropdownIconColor="#64748B"
                    style={styles.picker}>
                    <Picker.Item
                      label="Choose a subject"
                      value={null}
                      color="#94A3B8"
                    />
                    {subjects.map(sub => (
                      <Picker.Item
                        key={sub.id}
                        label={sub.subjectName}
                        value={sub.id}
                        color="#0F172A"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* TOPIC NAME */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Topic Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={topicName}
                  onChangeText={setTopicName}
                  placeholder="e.g. Algebra Basics"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* MARKS ROW */}
              <View style={styles.marksRow}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 6}]}>
                  <Text style={styles.inputLabel}>
                    Total Marks <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={totalMarks}
                    keyboardType="numeric"
                    onChangeText={setTotalMarks}
                    placeholder="100"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 6}]}>
                  <Text style={styles.inputLabel}>
                    Pass Marks <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={passingMarks}
                    keyboardType="numeric"
                    onChangeText={setPassingMarks}
                    placeholder="40"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* EXAM & PAPER TYPE SELECTOR WRAPPER WITH STRICT BOUNDS */}
              <View style={styles.selectorContainer}>
                <ExamPaperTypeSelector
                  userData={userData}
                  onExamTypeChange={setSelectedExamType}
                  onPaperTypeChange={setSelectedPaperType}
                />
              </View>

              <View style={styles.popupBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.75}
                  onPress={() => {
                    setCreateModalVisible(false);
                    resetCreateForm();
                  }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && {opacity: 0.6}]}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                  onPress={handleAssignMarksSubmit}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Assign Marks</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.dropdownOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <View style={styles.popupHeaderLeft}>
                <View style={styles.classIconBadge}>
                  <Ionicons name="pencil-outline" size={16} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.popupTitle}>Update Marks</Text>
                  <Text style={styles.popupSubtitle}>
                    {editingItem?.subject?.subjectName || 'Edit Record'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.popupCloseBtn}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingItem(null);
                }}>
                <Ionicons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.popupScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              
              {/* SUBJECT SELECTOR */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Subject <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={editSubject}
                    onValueChange={setEditSubject}
                    dropdownIconColor="#64748B"
                    style={styles.picker}>
                    <Picker.Item
                      label="Choose a subject"
                      value={null}
                      color="#94A3B8"
                    />
                    {(
                      editingItem?.classroom?.subjects ||
                      classroom?.subjects ||
                      []
                    ).map(sub => (
                      <Picker.Item
                        key={sub.id}
                        label={sub.subjectName}
                        value={sub.id}
                        color="#0F172A"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* TOPIC NAME */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Topic Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTopicName}
                  onChangeText={setEditTopicName}
                  placeholder="e.g. Algebra Basics"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* MARKS ROW */}
              <View style={styles.marksRow}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 6}]}>
                  <Text style={styles.inputLabel}>
                    Total Marks <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={editTotalMarks}
                    keyboardType="numeric"
                    onChangeText={setEditTotalMarks}
                    placeholder="100"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 6}]}>
                  <Text style={styles.inputLabel}>
                    Pass Marks <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={editPassingMarks}
                    keyboardType="numeric"
                    onChangeText={setEditPassingMarks}
                    placeholder="40"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* EXAM & PAPER TYPE SELECTOR WRAPPER WITH STRICT BOUNDS */}
              <View style={styles.selectorContainer}>
                <ExamPaperTypeSelector
                  userData={userData}
                  onExamTypeChange={setEditExamType}
                  onPaperTypeChange={setEditPaperType}
                  initialExamType={editExamType}
                  initialPaperType={editPaperType}
                />
              </View>

              <View style={styles.popupBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.75}
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingItem(null);
                  }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, isUpdating && {opacity: 0.6}]}
                  activeOpacity={0.8}
                  disabled={isUpdating}
                  onPress={handleUpdateSubmit}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Update Marks</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default AssignMarksScreen;

// ─────────────────────────────────────────────────────────────
// STYLESHEET
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  assignActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  assignActionBtnText: {
    fontSize: SCREEN_WIDTH < 360 ? 10 : 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Count Header
  countRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  countText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // List Container
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // Card Structure
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  titleArea: {
    flex: 1,
  },
  batchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  courseNameText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  inlineAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  inlineAssignText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // 2x2 Config Grid Styles
  configGridContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  configGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configGridCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  configGridDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  configRowDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  configLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  configValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },

  // Marks Stat Row
  marksStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  markStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  markStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
  },
  markStatLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  markStatValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Modals & Overlays
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  popupCard: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  popupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  popupSubtitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  popupCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupScroll: {
    padding: 14,
  },

  // Form Elements & Height Fixes
  inputGroup: {
    marginBottom: 10,
    width: '100%',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  required: {
    color: '#EF4444',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    justifyContent: 'center',
    height: 40,
    minHeight: 40,
  },
  picker: {
    height: 40,
    minHeight: 40,
    width: '100%',
    color: '#0F172A',
  },
  textInput: {
    height: 40,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  marksRow: {
    flexDirection: 'row',
    width: '100%',
  },
  selectorContainer: {
    width: '100%',
    marginBottom: 10,
    minHeight: 80,
  },

  // Modal Action Buttons
  popupBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Skeleton & Centered States
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  skeletonLineLong: {
    height: 11,
    width: '55%',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonLineShort: {
    height: 9,
    width: '30%',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonChip: {
    flex: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
});