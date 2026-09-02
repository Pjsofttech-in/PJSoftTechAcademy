import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Pressable,
  Linking,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TeacherHeader from '../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../components/TeacherComponent/TeacherFooter';
import {fetchSubmissionsForHomework} from '../../util/Apicall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = dateString => {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
};

const getFileTypeFromUrl = url => {
  if (!url) return 'unknown';
  const cleanUrl = url.split('?')[0];
  const ext = cleanUrl.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return 'image';
  }
  return ext || 'file';
};

const isImageUrl = url => getFileTypeFromUrl(url) === 'image';

const getStatusConfig = status => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return {
        color: '#10B981',
        bg: '#ECFDF5',
        borderColor: '#A7F3D0',
        icon: 'checkmark-circle-outline',
      };
    case 'submitted':
      return {
        color: '#6366F1',
        bg: '#EEF2FF',
        borderColor: '#C7D2FE',
        icon: 'checkmark-done-outline',
      };
    case 'pending':
      return {
        color: '#F59E0B',
        bg: '#FFFBEB',
        borderColor: '#FDE68A',
        icon: 'time-outline',
      };
    case 'late':
      return {
        color: '#EF4444',
        bg: '#FEF2F2',
        borderColor: '#FCA5A5',
        icon: 'alert-circle-outline',
      };
    default:
      return {
        color: '#64748B',
        bg: '#F1F5F9',
        borderColor: '#E2E8F0',
        icon: 'ellipse-outline',
      };
  }
};

const handleOpenFile = async url => {
  if (!url) return;
  try {
    let cleanUrl = String(url).trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const supported = await Linking.canOpenURL(cleanUrl);
    if (supported) {
      await Linking.openURL(cleanUrl);
    }
  } catch (err) {
    console.error('Error opening file URL:', err);
  }
};

// ─── Submission Card Component ────────────────────────────────────────────────
const SubmissionCard = React.memo(({submission, index}) => {
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

  const fileUrl = submission.submittedFileUrl;
  const hasImage = fileUrl && isImageUrl(fileUrl);
  const hasFile = fileUrl && !hasImage;
  const statusCfg = getStatusConfig(submission.status);
  const fileName = fileUrl ? fileUrl.split('?')[0].split('/').pop() : '';

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
        {/* ── Card Header: Student Info + Status Pill ── */}
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={18} color="#6366F1" />
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName} numberOfLines={1}>
                {submission.studentName || 'Unknown Student'}
              </Text>
              {submission.studentEmail ? (
                <Text style={styles.studentEmail} numberOfLines={1}>
                  {submission.studentEmail}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusCfg.bg,
                borderColor: statusCfg.borderColor,
              },
            ]}>
            <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, {color: statusCfg.color}]}>
              {submission.status || 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Answer Section Box ── */}
        {submission.answerText || submission.answer ? (
          <View style={styles.homeworkBox}>
            <Text style={styles.homeworkLabel}>Student Answer</Text>
            <Text style={styles.homeworkText} numberOfLines={4}>
              {submission.answerText || submission.answer}
            </Text>
          </View>
        ) : (
          <View style={styles.homeworkBox}>
            <Text style={styles.noAnswerText}>No text answer provided</Text>
          </View>
        )}

        {/* ── Bottom Row: Submission Date + Attachment Button ── */}
        <View style={styles.cardFooterRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={13} color="#6366F1" />
            <Text style={styles.dateValue} numberOfLines={1}>
              {formatDate(submission.submittedAt)}
            </Text>
          </View>

          {hasImage && (
            <Pressable
              onPress={() => handleOpenFile(fileUrl)}
              android_ripple={{color: 'rgba(99,102,241,0.1)'}}
              style={({pressed}) => [
                styles.compactActionBtn,
                pressed && {opacity: 0.8},
              ]}>
              <Image source={{uri: fileUrl}} style={styles.btnThumbnail} />
              <Text style={styles.compactActionBtnText}>Open Image</Text>
              <Ionicons name="open-outline" size={12} color="#6366F1" />
            </Pressable>
          )}

          {hasFile && (
            <Pressable
              onPress={() => handleOpenFile(fileUrl)}
              android_ripple={{color: 'rgba(99,102,241,0.1)'}}
              style={({pressed}) => [
                styles.compactActionBtn,
                pressed && {opacity: 0.8},
              ]}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color="#6366F1"
              />
              <Text style={styles.compactActionBtnText} numberOfLines={1}>
                {fileName ? 'View File' : 'View Attachment'}
              </Text>
              <Ionicons name="open-outline" size={12} color="#6366F1" />
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Main Screen Component ────────────────────────────────────────────────────
const AssignmentSubmission = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {assignmentId, teacherEmail, batchName} = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const subs = await fetchSubmissionsForHomework(
        assignmentId,
        teacherEmail,
      );
      setSubmissions(subs || []);
    } catch (err) {
      console.error('Error loading submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assignmentId, teacherEmail]);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    loadData();
  }, [loadData, headerAnim]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ── Metrics ──
  const completedCount = useMemo(
    () =>
      submissions.filter(
        s =>
          s.status?.toLowerCase() === 'completed' ||
          s.status?.toLowerCase() === 'submitted',
      ).length,
    [submissions],
  );

  const withFilesCount = useMemo(
    () => submissions.filter(s => !!s.submittedFileUrl).length,
    [submissions],
  );

  const renderItem = useCallback(
    ({item, index}) => <SubmissionCard submission={item} index={index} />,
    [],
  );

  const keyExtractor = useCallback(
    (item, index) => item.id?.toString() || index.toString(),
    [],
  );

  // ── Stats Metric Component ──
  const ListHeaderComponent = useMemo(
    () => (
      <>
        {submissions.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{submissions.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, {color: '#10B981'}]}>
                {completedCount}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, {color: '#6366F1'}]}>
                {withFilesCount}
              </Text>
              <Text style={styles.statLabel}>With Files</Text>
            </View>
          </View>
        )}
        <Text style={styles.resultCount}>
          {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}{' '}
          Received
        </Text>
      </>
    ),
    [submissions.length, completedCount, withFilesCount],
  );

  // ── Empty State ──
  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="document-text-outline" size={38} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>No Submissions Yet</Text>
        <Text style={styles.emptySubtitle}>
          Students haven't submitted their work for this assignment.
        </Text>
      </View>
    ),
    [],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <TeacherHeader />
        <View style={styles.fullScreenState}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
        <TeacherFooter />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

      {/* Professional Header Bar */}
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
          <View style={{flex: 1}}>
            <Text style={styles.pageTitle}>Submissions</Text>
            <Text style={styles.pageSubtitle} numberOfLines={1}>
              {batchName || 'View student assignment responses'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <FlatList
        data={submissions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6366F1']}
          />
        }
      />

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default AssignmentSubmission;

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  fullScreenState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Page Header Bar
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
  backBtn: {
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // ── Content Scroll Area
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 20,
  },

  // ── Stats Metrics Bar
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  resultCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Card Design
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },

  // ── Answer Box
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
  noAnswerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // ── Bottom Combined Row
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 1,
  },
  dateValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  compactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    maxWidth: '50%',
  },
  compactActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  btnThumbnail: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },

  // ── Empty State Component
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
