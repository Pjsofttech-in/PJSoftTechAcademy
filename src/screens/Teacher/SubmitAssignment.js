import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import DatePicker from 'react-native-date-picker';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {useAuth} from '../../auth/AuthContext';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  fetchHomeworkByTeacherAndClass,
  fetchClassroomByTeacher,
} from '../../util/Apicall';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = d => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatDisplayDate = d =>
  d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

const getFileTypeFromUrl = url => {
  if (!url) return 'unknown';
  const cleanUrl = url.split('?')[0];
  const ext = cleanUrl.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext))
    return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'document';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
  return ext || 'file';
};

const isImage = url => getFileTypeFromUrl(url) === 'image';

const getFileIcon = fileType => {
  if (!fileType) return 'document-outline';
  if (fileType.includes('image')) return 'image-outline';
  if (fileType.includes('pdf')) return 'document-text-outline';
  if (fileType.includes('word') || fileType.includes('doc'))
    return 'document-outline';
  if (fileType.includes('excel') || fileType.includes('sheet'))
    return 'grid-outline';
  return 'document-outline';
};

const getReadableFileSize = size => {
  if (!size) return '';
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB'][i]
  );
};

// ─── Assignment Card ───────────────────────────────────────────────────────────

const AssignmentCard = React.memo(
  ({assignment, index, onViewFile, onSubmissions}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          delay: Math.min(index, 8) * 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          delay: Math.min(index, 8) * 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index, fadeAnim, slideAnim]);

    const fileUrl = assignment.imageUrl || assignment.attachments;
    const hasImage = fileUrl && isImage(fileUrl);
    const hasFile = fileUrl && !hasImage;

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <View style={styles.iconBox}>
                <Ionicons name="book-outline" size={18} color="#6366F1" />
              </View>
              <View style={styles.batchInfo}>
                <Text style={styles.subjectName} numberOfLines={1}>
                  {assignment.subjectName || assignment.subject || 'No Subject'}
                </Text>

                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color="#6366F1"
                    />
                    <Text style={styles.dateValue}>
                      {formatDate(assignment.startDate)}
                    </Text>
                  </View>

                  <Ionicons name="arrow-forward" size={10} color="#94A3B8" />

                  <View style={[styles.dateItem, styles.dueDateItem]}>
                    <Ionicons name="alarm-outline" size={12} color="#DC2626" />
                    <Text style={styles.dueDateValue}>
                      {formatDate(assignment.endDate)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {assignment.homework ? (
            <View style={styles.homeworkBox}>
              <Text style={styles.homeworkLabel}>Assignment</Text>
              <Text style={styles.homeworkText} numberOfLines={3}>
                {assignment.homework}
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            {hasImage && (
              <Pressable
                onPress={() => onViewFile(fileUrl)}
                android_ripple={{color: 'rgba(99,102,241,0.1)'}}
                style={({pressed}) => [
                  styles.actionBtn,
                  pressed && {opacity: 0.8},
                ]}>
                <Image source={{uri: fileUrl}} style={styles.btnThumbnail} />
                <Text style={styles.actionBtnText}>Open Image</Text>
                <Ionicons name="open-outline" size={13} color="#6366F1" />
              </Pressable>
            )}

            {hasFile && (
              <Pressable
                onPress={() => onViewFile(fileUrl)}
                android_ripple={{color: 'rgba(99,102,241,0.1)'}}
                style={({pressed}) => [
                  styles.actionBtn,
                  pressed && {opacity: 0.8},
                ]}>
                <Ionicons
                  name="document-text-outline"
                  size={15}
                  color="#6366F1"
                />
                <Text style={styles.actionBtnText}>View File</Text>
                <Ionicons name="open-outline" size={13} color="#6366F1" />
              </Pressable>
            )}

            {!fileUrl && (
              <View style={[styles.actionBtn, styles.actionBtnDisabled]}>
                <Ionicons name="attach-outline" size={15} color="#CBD5E1" />
                <Text style={[styles.actionBtnText, {color: '#CBD5E1'}]}>
                  No File
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => onSubmissions(assignment)}
              android_ripple={{color: 'rgba(99,102,241,0.1)'}}
              style={({pressed}) => [
                styles.actionBtn,
                styles.actionBtnPrimary,
                pressed && {opacity: 0.85},
              ]}>
              <Ionicons name="people-outline" size={15} color="#6366F1" />
              <Text style={styles.actionBtnText}>Submissions</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  },
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SubmitAssignment = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Form states
  const [homework, setHomework] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Select Subject');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Date pickers
  const [isStartDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setEndDatePickerOpen] = useState(false);

  // Dropdown states
  const [isSubjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectDropdownHeight = useRef(new Animated.Value(0)).current;
  const subjectDropdownOpacity = useRef(new Animated.Value(0)).current;
  const [subjects, setSubjects] = useState([]);

  const {userData} = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const {classroomId, branchCode, batchName} = route.params || {};

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  // Fetch subjects for teacher
  useEffect(() => {
    let isSubscribed = true;
    const fetchClassroomData = async () => {
      try {
        if (!userData?.email) return;
        const response = await fetchClassroomByTeacher(
          userData.email,
          'teacher',
        );
        if (isSubscribed && Array.isArray(response)) {
          const allSubjects = [];
          response.forEach(c => {
            if (c.subjects) {
              c.subjects.forEach(s => {
                if (!allSubjects.find(x => x.id === s.id)) {
                  allSubjects.push({id: s.id, subjectName: s.subjectName});
                }
              });
            }
          });
          setSubjects(allSubjects);
        }
      } catch (e) {
        console.error('Error fetching subjects:', e);
      }
    };
    fetchClassroomData();
    return () => {
      isSubscribed = false;
    };
  }, [userData?.email]);

  // Fetch homework assignments
  const fetchHomeworkData = useCallback(async () => {
    if (!classroomId || !userData?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const homeworkData = await fetchHomeworkByTeacherAndClass(
        classroomId,
        userData.email,
      );
      const formatted = Array.isArray(homeworkData)
        ? homeworkData.map(a => ({
            id: a.id,
            subject: a.subjectName || a.subject,
            subjectName: a.subjectName || a.subject,
            homework: a.homework || a.homeworkText,
            startDate: a.startDate,
            endDate: a.endDate,
            status: a.status || 'Active',
            teacherEmail: a.teacherEmail,
            branchCode: a.branchCode,
            imageUrl: a.imageUrl,
          }))
        : [];
      setAssignments(formatted);
    } catch (e) {
      console.error('Error fetching homework:', e);
      Alert.alert('Error', 'Failed to load homework data');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [classroomId, userData?.email]);

  useEffect(() => {
    fetchHomeworkData();
  }, [fetchHomeworkData]);

  // Handle viewing files and S3 images in browser directly
  const handleViewFile = async rawUrl => {
    if (!rawUrl) {
      Alert.alert('Error', 'No file URL available.');
      return;
    }

    try {
      let url = String(rawUrl).trim();
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open this link in your browser.');
    }
  };

  const assignHomeworkWithFile = async formData => {
    const token = await AsyncStorage.getItem('teacherToken');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch('https://pjsofttech.in:46443/assignHomework', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    return response.json();
  };

  const resetForm = useCallback(() => {
    setHomework('');
    setSelectedSubject('Select Subject');
    setSelectedSubjectId(null);
    setStartDate(new Date());
    setEndDate(new Date());
    setUploadedFile(null);
  }, []);

  const closeSubjectDropdown = useCallback(() => {
    Animated.parallel([
      Animated.timing(subjectDropdownHeight, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(subjectDropdownOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: false,
      }),
    ]).start(() => setSubjectDropdownOpen(false));
  }, [subjectDropdownHeight, subjectDropdownOpacity]);

  const closeModal = useCallback(() => {
    if (isSubjectDropdownOpen) closeSubjectDropdown();
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      resetForm();
    });
  }, [closeSubjectDropdown, isSubjectDropdownOpen, modalOpacity, resetForm]);

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmitAssignment = async () => {
    if (!homework.trim()) {
      Alert.alert('Error', 'Please enter homework description');
      return;
    }
    if (selectedSubject === 'Select Subject' || !selectedSubjectId) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }
    if (startDate >= endDate) {
      Alert.alert('Error', 'Due date must be after start date');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('homeworkText', homework);
      formData.append('subject', selectedSubject);
      formData.append('classroomId', classroomId);
      formData.append('branchCode', branchCode);
      formData.append('teacherEmail', userData.email);
      formData.append('startDate', startDate.toISOString().split('T')[0]);
      formData.append('endDate', endDate.toISOString().split('T')[0]);
      if (uploadedFile) {
        formData.append('file', {
          uri: uploadedFile.uri,
          type: uploadedFile.type,
          name: uploadedFile.name,
        });
      }
      await assignHomeworkWithFile(formData);
      Alert.alert('Success', 'Assignment created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            closeModal();
            fetchHomeworkData();
          },
        },
      ]);
    } catch (err) {
      console.error('Error creating assignment:', err);
      Alert.alert('Error', 'Failed to create assignment. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const file = result[0];
      if (!file) return;
      setUploadedFile({
        uri: file.uri,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  const openSubjectDropdown = () => {
    setSubjectDropdownOpen(true);
    const toHeight = Math.min(subjects.length * 44, 220);
    Animated.parallel([
      Animated.timing(subjectDropdownHeight, {
        toValue: toHeight,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(subjectDropdownOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const toggleSubjectDropdown = () => {
    isSubjectDropdownOpen ? closeSubjectDropdown() : openSubjectDropdown();
  };

  const handleSelectSubject = subject => {
    setSelectedSubject(subject.subjectName);
    setSelectedSubjectId(subject.id);
    closeSubjectDropdown();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TeacherHeader />
        <View style={styles.fullScreenState}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
        <TeacherFooter />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TeacherHeader />

      <Animated.View
        style={[
          styles.pageHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.pageHeaderLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </Pressable>
          <View>
            <Text style={styles.pageTitle}>Assignments</Text>
            {batchName ? (
              <Text style={styles.pageSubtitle}>{batchName}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={openModal}
          android_ripple={{color: 'rgba(99,102,241,0.15)'}}
          style={({pressed}) => [
            styles.newAssignmentBtn,
            pressed && {opacity: 0.85},
          ]}>
          <Ionicons name="add" size={18} color="#6366F1" />
          <Text style={styles.newAssignmentBtnText}>New Assignment</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>
          {assignments.length} Assignment{assignments.length !== 1 ? 's' : ''}{' '}
          Available
        </Text>

        {assignments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons
                name="document-text-outline"
                size={38}
                color="#94A3B8"
              />
            </View>
            <Text style={styles.emptyTitle}>No assignments yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "New Assignment" to create your first assignment
            </Text>
          </View>
        ) : (
          assignments.map((assignment, index) => (
            <AssignmentCard
              key={assignment.id || index}
              assignment={assignment}
              index={index}
              onViewFile={handleViewFile}
              onSubmissions={a =>
                navigation.navigate('AssignmentSubmission', {
                  assignmentId: a.id,
                  teacherEmail: a.teacherEmail,
                  batchName,
                  classroomId,
                  branchCode,
                })
              }
            />
          ))
        )}
      </ScrollView>

      <TeacherFooter />

      <Modal transparent visible={isModalVisible} animationType="none">
        <Animated.View style={[styles.modalOverlay, {opacity: modalOpacity}]}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="book-outline" size={18} color="#6366F1" />
                </View>
                <Text style={styles.modalTitle}>New Assignment</Text>
              </View>
              <Pressable onPress={closeModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.modalDivider} />

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assignment Description *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={homework}
                    onChangeText={setHomework}
                    placeholder="Enter assignment description..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subject *</Text>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={toggleSubjectDropdown}>
                  <View style={styles.dropdownTriggerLeft}>
                    <Ionicons name="book-outline" size={16} color="#94A3B8" />
                    <Text
                      style={[
                        styles.dropdownTriggerText,
                        selectedSubject === 'Select Subject' &&
                          styles.placeholderText,
                      ]}>
                      {selectedSubject}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSubjectDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#94A3B8"
                  />
                </Pressable>

                <Animated.View
                  style={[
                    styles.inlineDropdown,
                    {
                      height: subjectDropdownHeight,
                      opacity: subjectDropdownOpacity,
                    },
                  ]}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                    {subjects.map((subject, idx) => (
                      <Pressable
                        key={subject.id || idx}
                        style={[
                          styles.dropdownItem,
                          idx === subjects.length - 1 &&
                            styles.dropdownItemLast,
                        ]}
                        onPress={() => handleSelectSubject(subject)}>
                        <Ionicons
                          name="book-outline"
                          size={14}
                          color="#6366F1"
                        />
                        <Text style={styles.dropdownItemText}>
                          {subject.subjectName}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Animated.View>
              </View>

              <View style={styles.datePickerRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.formLabel}>Start Date *</Text>
                  <Pressable
                    style={styles.datePicker}
                    onPress={() => setStartDatePickerOpen(true)}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#6366F1"
                    />
                    <Text style={styles.datePickerText}>
                      {formatDisplayDate(startDate)}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.formLabel}>Due Date *</Text>
                  <Pressable
                    style={styles.datePicker}
                    onPress={() => setEndDatePickerOpen(true)}>
                    <Ionicons name="alarm-outline" size={16} color="#EF4444" />
                    <Text style={[styles.datePickerText, {color: '#EF4444'}]}>
                      {formatDisplayDate(endDate)}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Attachment (Optional)</Text>
                {!uploadedFile ? (
                  <Pressable
                    style={styles.uploadBtn}
                    onPress={handleFileUpload}
                    disabled={isUploading}>
                    <View style={styles.uploadIconBox}>
                      <Ionicons
                        name="cloud-upload-outline"
                        size={22}
                        color="#6366F1"
                      />
                    </View>
                    <View>
                      <Text style={styles.uploadBtnTitle}>
                        {isUploading ? 'Uploading...' : 'Upload File'}
                      </Text>
                      <Text style={styles.uploadBtnSubtitle}>
                        PDF, DOC, Images up to 10MB
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.filePreview}>
                    <View style={styles.filePreviewIconBox}>
                      <Ionicons
                        name={getFileIcon(uploadedFile.type)}
                        size={22}
                        color="#6366F1"
                      />
                    </View>
                    <View style={styles.filePreviewInfo}>
                      <Text style={styles.filePreviewName} numberOfLines={1}>
                        {uploadedFile.name}
                      </Text>
                      <Text style={styles.filePreviewSize}>
                        {getReadableFileSize(uploadedFile.size)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setUploadedFile(null)}
                      style={styles.fileRemoveBtn}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.submitBtn,
                  isUploading && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitAssignment}
                disabled={isUploading}>
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Create</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Modal>

      <DatePicker
        modal
        open={isStartDatePickerOpen}
        date={startDate}
        mode="date"
        title="Select Start Date"
        onConfirm={date => {
          setStartDate(date);
          setStartDatePickerOpen(false);
        }}
        onCancel={() => setStartDatePickerOpen(false)}
      />
      <DatePicker
        modal
        open={isEndDatePickerOpen}
        date={endDate}
        mode="date"
        title="Select Due Date"
        onConfirm={date => {
          setEndDate(date);
          setEndDatePickerOpen(false);
        }}
        onCancel={() => setEndDatePickerOpen(false)}
      />
    </View>
  );
};

export default SubmitAssignment;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  fullScreenState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {fontSize: 13, color: '#64748B', fontWeight: '600'},
  pageHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {padding: 4},
  pageTitle: {fontSize: 20, fontWeight: '800', color: '#0F172A'},
  pageSubtitle: {fontSize: 12, color: '#64748B', marginTop: 1},
  newAssignmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  newAssignmentBtnText: {fontSize: 12, fontWeight: '600', color: '#6366F1'},
  scrollContent: {paddingHorizontal: 10, paddingTop: 12, paddingBottom: 20},
  resultCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  cardWrapper: {marginBottom: 12},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchInfo: {flex: 1},
  subjectName: {fontSize: 14, fontWeight: '700', color: '#0F172A'},
  divider: {height: 1, backgroundColor: '#F1F5F9', marginVertical: 10},
  homeworkBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  homeworkLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  homeworkText: {fontSize: 12, color: '#334155', lineHeight: 18},
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  dueDateItem: {
    backgroundColor: '#FEF2F2',
  },
  dateValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dueDateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionRow: {flexDirection: 'row', gap: 8},
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  btnThumbnail: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  actionBtnPrimary: {backgroundColor: '#EEF2FF', borderColor: '#C7D2FE'},
  actionBtnDisabled: {backgroundColor: '#F8FAFC', borderColor: '#E2E8F0'},
  actionBtnText: {fontSize: 12, fontWeight: '600', color: '#6366F1'},
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {fontSize: 15, fontWeight: '700', color: '#0F172A'},
  emptySubtitle: {fontSize: 12, color: '#64748B', marginTop: 4},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalHeaderLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {fontSize: 15, fontWeight: '700', color: '#0F172A'},
  modalCloseBtn: {padding: 4},
  modalDivider: {height: 1, backgroundColor: '#E2E8F0'},
  modalContent: {padding: 16},
  formGroup: {marginBottom: 16},
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  textInput: {fontSize: 13, color: '#0F172A', minHeight: 80},
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  dropdownTriggerLeft: {flexDirection: 'row', alignItems: 'center', gap: 8},
  dropdownTriggerText: {fontSize: 13, color: '#0F172A'},
  placeholderText: {color: '#94A3B8'},
  inlineDropdown: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemLast: {borderBottomWidth: 0},
  dropdownItemText: {fontSize: 12, fontWeight: '600', color: '#0F172A'},
  datePickerRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  dateInputContainer: {flex: 1},
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  datePickerText: {fontSize: 12, fontWeight: '600', color: '#0F172A'},
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
  },
  uploadIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnTitle: {fontSize: 12, fontWeight: '600', color: '#0F172A'},
  uploadBtnSubtitle: {fontSize: 10, color: '#64748B', marginTop: 1},
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  filePreviewIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePreviewInfo: {flex: 1},
  filePreviewName: {fontSize: 12, fontWeight: '600', color: '#0F172A'},
  filePreviewSize: {fontSize: 10, color: '#64748B'},
  fileRemoveBtn: {padding: 4},
  modalFooter: {flexDirection: 'row', gap: 10, padding: 16},
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {fontSize: 13, fontWeight: '600', color: '#64748B'},
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366F1',
  },
  submitBtnDisabled: {backgroundColor: '#A5B4FC'},
  submitBtnText: {fontSize: 13, fontWeight: '600', color: '#FFFFFF'},
});
