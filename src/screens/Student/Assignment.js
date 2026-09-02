import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  ActivityIndicator,
  Linking,
  Image,
  Modal,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchHomeworkForStudent, submitHomeworkApi} from '../../util/Apicall';
import {submitHomeworkUrl} from '../../util/Url';
import StudentHeader from '../../components/StudentComponent/StudentHeader';
import StudentFooter from '../../components/StudentComponent/StudentFooter';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STATUS_OPTIONS = ['Processed', 'Completed'];
const FILTERS = ['All', 'Pending', 'Submitted'];

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = d => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const getFileTypeFromUrl = url => {
  if (!url) return 'unknown';
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext))
    return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'document';
  return ext || 'file';
};

const isImage = url => getFileTypeFromUrl(url) === 'image';

const getFileIcon = type => {
  if (!type) return 'document-outline';
  if (type.includes('image')) return 'image-outline';
  if (type.includes('pdf')) return 'document-text-outline';
  return 'document-outline';
};

const getReadableFileSize = size => {
  if (!size) return '';
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB'][i]
  );
};

const isAssignmentSubmitted = a =>
  a.isSubmitted ||
  (a.status || '').toLowerCase() === 'submitted' ||
  (a.status || '').toLowerCase() === 'completed';

const getUrgency = (dueDateRaw, submitted) => {
  if (submitted) return null;
  if (!dueDateRaw) return null;
  const due = new Date(dueDateRaw);
  const now = new Date();
  const diffMs = due - now;
  const diffHrs = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return {
      label: 'Overdue',
      bg: '#FEF2F2',
      color: '#DC2626',
      icon: 'alert-circle',
    };
  }
  if (diffHrs <= 24) {
    return {label: 'Due today', bg: '#FEF3C7', color: '#B45309', icon: 'flame'};
  }
  if (diffHrs <= 72) {
    return {
      label: `Due in ${Math.ceil(diffHrs / 24)}d`,
      bg: '#FFF7ED',
      color: '#C2410C',
      icon: 'time',
    };
  }
  return {
    label: `Due in ${Math.ceil(diffHrs / 24)}d`,
    bg: '#F0FDF4',
    color: '#15803D',
    icon: 'checkmark-circle-outline',
  };
};

// ─── Toast ──────────────────────────────────────────────────────────────────

const Toast = ({toast, onHide}) => {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, 2600);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          backgroundColor: isError ? '#DC2626' : '#0F172A',
          transform: [{translateY}],
          opacity,
        },
      ]}
      pointerEvents="none">
      <Ionicons
        name={isError ? 'close-circle' : 'checkmark-circle'}
        size={18}
        color="#fff"
      />
      <Text style={toastStyles.text}>{toast.message}</Text>
    </Animated.View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 999,
  },
  text: {color: '#fff', fontSize: 13, fontWeight: '600', flex: 1},
});

// ─── Skeleton loading card ─────────────────────────────────────────────────

const SkeletonCard = () => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[skeletonStyles.card, {opacity: pulse}]}>
      <View style={skeletonStyles.rowTop}>
        <View style={skeletonStyles.iconBox} />
        <View style={{flex: 1}}>
          <View style={[skeletonStyles.bar, {width: '55%'}]} />
          <View style={[skeletonStyles.bar, {width: '35%', marginTop: 8}]} />
        </View>
      </View>
      <View style={[skeletonStyles.bar, {width: '90%', marginTop: 16}]} />
      <View style={[skeletonStyles.bar, {width: '70%', marginTop: 8}]} />
      <View style={skeletonStyles.rowBottom}>
        <View style={skeletonStyles.pillPlaceholder} />
        <View style={skeletonStyles.pillPlaceholder} />
      </View>
    </Animated.View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  rowTop: {flexDirection: 'row', gap: 12, alignItems: 'center'},
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  bar: {height: 10, borderRadius: 6, backgroundColor: '#E2E8F0'},
  rowBottom: {flexDirection: 'row', gap: 8, marginTop: 16},
  pillPlaceholder: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
  },
});

// ─── Filter Tabs ────────────────────────────────────────────────────────────

const FilterTabs = ({active, onChange, counts}) => (
  <View style={filterStyles.wrap}>
    {FILTERS.map(f => {
      const isActive = active === f;
      return (
        <Pressable
          key={f}
          onPress={() => onChange(f)}
          style={[filterStyles.tab, isActive && filterStyles.tabActive]}
          accessibilityRole="button"
          accessibilityState={{selected: isActive}}>
          <Text
            style={[
              filterStyles.tabText,
              isActive && filterStyles.tabTextActive,
            ]}>
            {f}
          </Text>
          <View
            style={[
              filterStyles.countBadge,
              isActive && filterStyles.countBadgeActive,
            ]}>
            <Text
              style={[
                filterStyles.countText,
                isActive && filterStyles.countTextActive,
              ]}>
              {counts[f]}
            </Text>
          </View>
        </Pressable>
      );
    })}
  </View>
);

const filterStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#EEF1F6',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 10,
    marginBottom: 14,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tabText: {fontSize: 12, fontWeight: '600', color: '#64748B'},
  tabTextActive: {color: '#0F172A'},
  countBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeActive: {backgroundColor: '#EEF2FF'},
  countText: {fontSize: 10, fontWeight: '700', color: '#64748B'},
  countTextActive: {color: '#6366F1'},
});

// ─── Submit Homework Modal ──────────────────────────────────────────────────

const SubmitHomeworkModal = ({
  visible,
  assignment,
  onClose,
  onSuccess,
  onError,
}) => {
  const [answerText, setAnswerText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setAnswerText('');
    setSelectedStatus('');
    setUploadedFile(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const file = result[0];
      if (!file) return;

      if (file.size && file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({...prev, file: 'File must be under 10MB.'}));
        return;
      }

      setErrors(prev => ({...prev, file: null}));
      setUploadedFile({
        uri: file.uri,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        setErrors(prev => ({...prev, file: 'Failed to pick file. Try again.'}));
      }
    }
  };

  const handleRemoveFile = () => setUploadedFile(null);

  const validate = () => {
    const next = {};
    if (!answerText.trim()) next.answer = 'Please describe your answer.';
    if (!selectedStatus) next.status = 'Please select a status.';
    setErrors(prev => ({
      ...prev,
      ...next,
      answer: next.answer,
      status: next.status,
    }));
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const studentDataRaw = await AsyncStorage.getItem('studentData');
      const studentData = studentDataRaw ? JSON.parse(studentDataRaw) : {};

      const formData = new FormData();
      formData.append('homeworkId', String(assignment.id));
      formData.append('studentEmail', studentData.email || '');
      formData.append('branchCode', studentData.branchCode || '');
      formData.append('answerText', answerText.trim());
      formData.append('status', selectedStatus);

      if (uploadedFile) {
        formData.append('file', {
          uri: uploadedFile.uri,
          name: uploadedFile.name,
          type: uploadedFile.type || 'application/octet-stream',
        });
      }

      const result = await submitHomeworkApi(submitHomeworkUrl, formData);

      if (result.success) {
        handleClose();
        onSuccess && onSuccess();
      } else {
        onError &&
          onError(result.message || 'Submission failed. Please try again.');
      }
    } catch (error) {
      onError && onError('Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <View style={modalStyles.headerLeft}>
              <View style={modalStyles.headerIconBox}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color="#6366F1"
                />
              </View>
              <View>
                <Text style={modalStyles.headerTitle}>Submit Assignment</Text>
                <Text style={modalStyles.headerSubtitle} numberOfLines={1}>
                  {assignment.subject || assignment.subjectName || 'Homework'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              style={modalStyles.closeBtn}
              hitSlop={8}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <View style={modalStyles.divider} />

          <View style={modalStyles.formScroll}>
            <View style={modalStyles.formGroup}>
              <Text style={modalStyles.formLabel}>Answer Description *</Text>
              <View
                style={[
                  modalStyles.inputWrapper,
                  errors.answer && modalStyles.inputWrapperError,
                ]}>
                <TextInput
                  style={modalStyles.textInput}
                  value={answerText}
                  onChangeText={t => {
                    setAnswerText(t);
                    if (errors.answer)
                      setErrors(prev => ({...prev, answer: null}));
                  }}
                  placeholder="Write your answer here..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              {errors.answer ? (
                <Text style={modalStyles.errorText}>{errors.answer}</Text>
              ) : null}
            </View>

            <View style={modalStyles.formGroup}>
              <Text style={modalStyles.formLabel}>Status *</Text>
              <View style={modalStyles.chipRow}>
                {STATUS_OPTIONS.map(option => {
                  const active = selectedStatus === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setSelectedStatus(option);
                        if (errors.status)
                          setErrors(prev => ({...prev, status: null}));
                      }}
                      style={[
                        modalStyles.chip,
                        active && modalStyles.chipActive,
                      ]}>
                      <Ionicons
                        name={
                          option === 'Completed'
                            ? 'checkmark-circle-outline'
                            : 'time-outline'
                        }
                        size={15}
                        color={active ? '#6366F1' : '#94A3B8'}
                      />
                      <Text
                        style={[
                          modalStyles.chipText,
                          active && modalStyles.chipTextActive,
                        ]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.status ? (
                <Text style={modalStyles.errorText}>{errors.status}</Text>
              ) : null}
            </View>

            <View style={modalStyles.formGroup}>
              <View style={modalStyles.labelRow}>
                <Text style={modalStyles.formLabel}>Attachment (Optional)</Text>
                <Text style={modalStyles.labelHint}>Max 10MB</Text>
              </View>

              {!uploadedFile ? (
                <Pressable
                  style={modalStyles.uploadBtn}
                  onPress={handlePickFile}
                  disabled={isSubmitting}>
                  <View style={modalStyles.uploadIconBox}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={22}
                      color="#6366F1"
                    />
                  </View>
                  <View>
                    <Text style={modalStyles.uploadBtnTitle}>Choose File</Text>
                    <Text style={modalStyles.uploadBtnSubtitle}>
                      PDF, DOC, or image
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <View style={modalStyles.filePreview}>
                  <View style={modalStyles.filePreviewIconBox}>
                    <Ionicons
                      name={getFileIcon(uploadedFile.type)}
                      size={22}
                      color="#6366F1"
                    />
                  </View>
                  <View style={modalStyles.filePreviewInfo}>
                    <Text style={modalStyles.filePreviewName} numberOfLines={1}>
                      {uploadedFile.name}
                    </Text>
                    <Text style={modalStyles.filePreviewSize}>
                      {getReadableFileSize(uploadedFile.size)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handlePickFile}
                    style={modalStyles.fileActionBtn}
                    hitSlop={6}>
                    <Text style={modalStyles.fileActionText}>Replace</Text>
                  </Pressable>
                  <Pressable onPress={handleRemoveFile} hitSlop={6}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              )}
              {errors.file ? (
                <Text style={modalStyles.errorText}>{errors.file}</Text>
              ) : null}
            </View>

            {isSubmitting && (
              <View style={modalStyles.progressWrap}>
                <View style={modalStyles.progressTrack}>
                  <ProgressPulse />
                </View>
                <Text style={modalStyles.progressLabel}>
                  Submitting your assignment…
                </Text>
              </View>
            )}
          </View>

          <View style={modalStyles.divider} />

          <View style={modalStyles.footer}>
            <Pressable
              style={modalStyles.cancelBtn}
              onPress={handleClose}
              disabled={isSubmitting}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                modalStyles.submitBtn,
                isSubmitting && modalStyles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={modalStyles.submitBtnText}>Submit</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProgressPulse = () => {
  const x = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, {toValue: 1, duration: 1100, useNativeDriver: true}),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = x.interpolate({
    inputRange: [-1, 1],
    outputRange: [-140, 140],
  });

  return (
    <View style={{width: '100%', overflow: 'hidden'}}>
      <Animated.View
        style={{
          width: 100,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#6366F1',
          transform: [{translateX}],
        }}
      />
    </View>
  );
};

// ─── Assignment Card ────────────────────────────────────────────────────────

const AssignmentCard = ({assignment, index, onViewFile, onSubmit}) => {
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
  }, []);

  const fileUrl = assignment.imageUrl || assignment.attachments;
  const hasImage = fileUrl && isImage(fileUrl);
  const hasFile = fileUrl && !hasImage;
  const submitted = isAssignmentSubmitted(assignment);
  const dueDateRaw = assignment.endDate || assignment.dueDate;
  const isExpired = dueDateRaw ? new Date(dueDateRaw) < new Date() : false;
  const urgency = getUrgency(dueDateRaw, submitted);

  const subjectLabel =
    assignment.subject || assignment.subjectName || 'No Subject';
  const teacherLabel =
    assignment.teacher ||
    assignment.teacherName ||
    assignment.assignedBy ||
    null;
  const homeworkLabel =
    assignment.homework ||
    assignment.title ||
    assignment.homeworkTitle ||
    assignment.assignmentTitle ||
    null;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
      ]}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <View style={styles.iconBox}>
              <Ionicons name="book-outline" size={18} color="#6366F1" />
            </View>
            <View style={styles.batchInfo}>
              <Text style={styles.subjectName} numberOfLines={1}>
                {subjectLabel}
              </Text>
              <Text style={styles.srLabel} numberOfLines={1}>
                {teacherLabel || `Assignment #${index + 1}`}
              </Text>
            </View>
          </View>

          {urgency && (
            <View style={[styles.urgencyPill, {backgroundColor: urgency.bg}]}>
              <Ionicons name={urgency.icon} size={11} color={urgency.color} />
              <Text style={[styles.urgencyText, {color: urgency.color}]}>
                {urgency.label}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {homeworkLabel ? (
          <View style={styles.homeworkBox}>
            <Text style={styles.homeworkLabel}>Assignment</Text>
            <Text style={styles.homeworkText} numberOfLines={3}>
              {homeworkLabel}
            </Text>
          </View>
        ) : null}

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={13} color="#6366F1" />
            <Text style={styles.dateLabel}>Assigned</Text>
            <Text style={styles.dateValue}>
              {formatDate(assignment.startDate || assignment.assignedDate)}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
          <View style={styles.dateItem}>
            <Ionicons name="alarm-outline" size={13} color="#EF4444" />
            <Text style={styles.dateLabel}>Due</Text>
            <Text style={[styles.dateValue, {color: '#EF4444'}]}>
              {formatDate(dueDateRaw)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          {/* Directly opens image link in browser */}
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

          {submitted ? (
            <View style={[styles.actionBtn, styles.actionBtnDone]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={15}
                color="#15803D"
              />
              <Text style={[styles.actionBtnText, {color: '#15803D'}]}>
                Submitted
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => onSubmit(assignment)}
              android_ripple={{color: 'rgba(99,102,241,0.1)'}}
              style={({pressed}) => [
                styles.actionBtn,
                isExpired ? styles.actionBtnDisabled : styles.actionBtnPrimary,
                pressed && {opacity: 0.85},
              ]}>
              <Ionicons
                name={
                  isExpired ? 'lock-closed-outline' : 'cloud-upload-outline'
                }
                size={15}
                color={isExpired ? '#94A3B8' : '#6366F1'}
              />
              <Text
                style={[styles.actionBtnText, isExpired && {color: '#94A3B8'}]}>
                {isExpired ? 'Closed' : 'Submit'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────

const Assignment = () => {
  const [homeworkData, setHomeworkData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [expiredModal, setExpiredModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitModal, setSubmitModal] = useState({
    visible: false,
    assignment: null,
  });

  const showToast = (message, type = 'success') => setToast({message, type});

  const loadHomeworkData = useCallback(async (isPullRefresh = false) => {
    try {
      isPullRefresh ? setIsRefreshing(true) : setIsLoading(true);
      const data = await fetchHomeworkForStudent();
      setHomeworkData(data || []);
    } catch (error) {
      setHomeworkData([]);
      showToast('Could not load assignments.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeworkData();
  }, [loadHomeworkData]);

  const counts = useMemo(() => {
    const submitted = homeworkData.filter(isAssignmentSubmitted).length;
    return {
      All: homeworkData.length,
      Pending: homeworkData.length - submitted,
      Submitted: submitted,
    };
  }, [homeworkData]);

  const filteredData = useMemo(() => {
    if (activeFilter === 'All') return homeworkData;
    if (activeFilter === 'Pending')
      return homeworkData.filter(a => !isAssignmentSubmitted(a));
    return homeworkData.filter(isAssignmentSubmitted);
  }, [homeworkData, activeFilter]);

  const handleOpenSubmit = assignment => {
    const dueDate = new Date(assignment.endDate || assignment.dueDate);
    if (dueDate < new Date()) {
      setExpiredModal(true);
      return;
    }
    setSubmitModal({visible: true, assignment});
  };

  const handleCloseSubmit = () =>
    setSubmitModal({visible: false, assignment: null});

  const handleSubmitSuccess = () => {
    showToast('Assignment submitted successfully!');
    loadHomeworkData();
  };

  const handleSubmitError = message => showToast(message, 'error');

  const handleViewFile = async rawUrl => {
    if (!rawUrl) {
      showToast('No file URL available.', 'error');
      return;
    }

    try {
      // Clean whitespace and trim
      let url = String(rawUrl).trim();

      // Ensure the URL has a protocol scheme
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }

      // Attempt to open directly
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback: Attempt opening directly if canOpenURL check is restricted by OS
        await Linking.openURL(url);
      }
    } catch (err) {
      showToast('Unable to open this link.', 'error');
    }
  };

  const renderCard = ({item, index}) => (
    <AssignmentCard
      assignment={item}
      index={index}
      onViewFile={handleViewFile}
      onSubmit={handleOpenSubmit}
    />
  );

  return (
    <View style={styles.container}>
      <StudentHeader />

      <View style={styles.screenTitleBar}>
        <Text style={styles.screenTitle}>Assignments</Text>
        <Text style={styles.screenSubtitle}>Your homework & tasks</Text>
      </View>

      <FilterTabs
        active={activeFilter}
        onChange={setActiveFilter}
        counts={counts}
      />

      {isLoading ? (
        <View style={{paddingTop: 4}}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderCard}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadHomeworkData(true)}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons
                  name="document-text-outline"
                  size={38}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'All'
                  ? 'No assignments yet'
                  : `No ${activeFilter.toLowerCase()} assignments`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'All'
                  ? "Your teacher hasn't posted any assignments yet."
                  : 'Try a different filter above.'}
              </Text>
            </View>
          }
        />
      )}

      <StudentFooter />

      <Toast toast={toast} onHide={() => setToast(null)} />

      <SubmitHomeworkModal
        visible={submitModal.visible}
        assignment={submitModal.assignment}
        onClose={handleCloseSubmit}
        onSuccess={handleSubmitSuccess}
        onError={handleSubmitError}
      />

      <Modal
        visible={expiredModal}
        transparent
        animationType="fade"
        onRequestClose={() => setExpiredModal(false)}>
        <View style={popupStyles.overlay}>
          <View style={popupStyles.container}>
            <View style={popupStyles.iconContainer}>
              <Ionicons name="time-outline" size={36} color="#EF4444" />
            </View>
            <Text style={popupStyles.title}>Submission Closed</Text>
            <Text style={popupStyles.message}>
              The submission deadline has expired.{'\n\n'}
              This assignment is no longer accepting submissions.
            </Text>
            <Pressable
              style={popupStyles.okButton}
              onPress={() => setExpiredModal(false)}>
              <Text style={popupStyles.okText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Assignment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenTitleBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 12,
  },
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
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  srLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  urgencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
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
  homeworkText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  dateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  actionBtnPrimary: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  actionBtnDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
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
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  formScroll: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  textInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#6366F1',
  },
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
  uploadBtnTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  uploadBtnSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
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
  filePreviewInfo: {
    flex: 1,
  },
  filePreviewName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  filePreviewSize: {
    fontSize: 10,
    color: '#64748B',
  },
  fileActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fileActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  progressWrap: {
    marginTop: 8,
    alignItems: 'center',
    gap: 6,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
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
  submitBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  message: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  okButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  okText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
