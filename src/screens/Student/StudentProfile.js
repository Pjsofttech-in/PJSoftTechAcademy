import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Clipboard,
  Share,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {getUserById} from '../../util/Apicall';

const StudentProfile = ({route, navigation}) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      const storedStudentData = await AsyncStorage.getItem('studentData');
      const storedUserData = await AsyncStorage.getItem('userData');

      let userId, userEmail;

      if (storedStudentData) {
        const parsedStudentData = JSON.parse(storedStudentData);
        userId = parsedStudentData.id;
        userEmail = parsedStudentData.email;
      } else if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        userId = parsedUserData.id;
        userEmail = parsedUserData.email;
      } else if (route.params?.studentId && route.params?.email) {
        userId = route.params.studentId;
        userEmail = route.params.email;
      }

      if (!userId || !userEmail) {
        throw new Error('Student ID or email not found');
      }

      const response = await getUserById(userId, userEmail);

      if (response.success && response.data) {
        setStudentData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch student data');
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    Clipboard.setString(String(text));
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  const handleShareProfile = async () => {
    if (!studentData) return;
    try {
      await Share.share({
        message: `Student Profile:\nName: ${studentData.name}\nReg No: ${studentData.registrationNo}\nCourse: ${studentData.coursename}\nRoll No: ${studentData.rollNo}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.header}>
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

  if (error || !studentData) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.header}>
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
          <TouchableOpacity style={styles.retryBtn} onPress={fetchStudentData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalFees = studentData.totalFees || 0;
  const paidFees = studentData.paidFees || 0;
  const pendingFees = studentData.pendingFees || 0;
  const feePercentage =
    totalFees > 0 ? Math.min(100, Math.round((paidFees / totalFees) * 100)) : 0;

  const classroom = studentData.admissionClassRoom;
  const teachers = classroom?.teachers || [];
  const subjects = classroom?.subjects || [];

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleShareProfile} style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={20} color="#6366F1" />
        </TouchableOpacity>
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
            {studentData.studentImage && (
              <View style={styles.avatarWrapper}>
                <Image
                  source={{uri: studentData.studentImage}}
                  style={styles.avatar}
                />
                <View style={styles.activeDot} />
              </View>
            )}

            <View style={styles.heroMainInfo}>
              {studentData.name && (
                <Text style={styles.studentName} numberOfLines={1}>
                  {studentData.name}
                </Text>
              )}

              {/* Registration Number with Copy Icon */}
              {studentData.registrationNo && (
                <View style={styles.regRow}>
                  <Text style={styles.regSubText}>
                    Reg No:{' '}
                    <Text style={styles.regValue}>
                      {studentData.registrationNo}
                    </Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyToClipboard(
                        studentData.registrationNo,
                        'Registration No',
                      )
                    }
                    style={styles.copyIconBtn}>
                    <Ionicons name="copy-outline" size={15} color="#6366F1" />
                  </TouchableOpacity>
                </View>
              )}

              {studentData.rollNo && (
                <Text style={styles.rollText}>Roll: {studentData.rollNo}</Text>
              )}

              <View style={styles.badgeRow}>
                {studentData.coursename && (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>
                      {studentData.coursename}
                    </Text>
                  </View>
                )}
                {(studentData.mediumName || classroom?.medium?.mediumName) && (
                  <View style={[styles.tagPill, styles.mediumPill]}>
                    <Text style={styles.mediumPillText}>
                      {studentData.mediumName || classroom?.medium?.mediumName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Fee & Batch Quick Metric Grid */}
        <View style={styles.gridRow}>
          {/* Fee Snapshot Card */}
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.cardHeaderSmall}>
              <Ionicons name="wallet-outline" size={16} color="#6366F1" />
              <Text style={styles.gridTitle}>Fees</Text>
            </View>

            <Text style={styles.feeHighlight}>
              ₹{paidFees.toLocaleString()}
            </Text>
            <Text style={styles.feeSubText}>
              of ₹{totalFees.toLocaleString()} paid
            </Text>

            <View style={styles.miniTrack}>
              <View style={[styles.miniFill, {width: `${feePercentage}%`}]} />
            </View>

            {studentData.paymentMethod && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {studentData.paymentMethod}
                </Text>
              </View>
            )}
          </View>

          {/* Batch & Schedule Snapshot Card */}
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.cardHeaderSmall}>
              <Ionicons name="time-outline" size={16} color="#6366F1" />
              <Text style={styles.gridTitle}>Batch Info</Text>
            </View>

            {classroom?.batchStartTime && classroom?.batchEndTime && (
              <Text style={styles.timeText}>
                {classroom.batchStartTime.slice(0, 5)} -{' '}
                {classroom.batchEndTime.slice(0, 5)}
              </Text>
            )}

            {classroom?.batchName && (
              <Text style={styles.batchSubText}>
                Batch: {classroom.batchName}
              </Text>
            )}

            {subjects.length > 0 && (
              <View style={styles.subjectChipList}>
                {subjects.map((sub, i) => (
                  <View key={sub.id || i} style={styles.miniChip}>
                    <Text style={styles.miniChipText}>{sub.subjectName}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Academic Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Academic Details</Text>

          {studentData.academicYear && (
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Academic Year:</Text>
              <Text style={styles.infoValue}>{studentData.academicYear}</Text>
            </View>
          )}

          {studentData.duration && (
            <View style={styles.infoRow}>
              <Ionicons
                name="hourglass-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>{studentData.duration}</Text>
            </View>
          )}

          {studentData.date && (
            <View style={styles.infoRow}>
              <Ionicons
                name="today-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Admission Date:</Text>
              <Text style={styles.infoValue}>
                {formatDate(studentData.date)}
              </Text>
            </View>
          )}

          {studentData.expiredate && (
            <View style={styles.infoRow}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Expiry Date:</Text>
              <Text style={styles.infoValue}>
                {formatDate(studentData.expiredate)}
              </Text>
            </View>
          )}

          {teachers.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Guide/Teacher:</Text>
              <Text style={styles.infoValue}>
                {teachers.map(t => t.teacherName).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Contact & Personal Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Personal & Contact</Text>

          {studentData.email && (
            <View style={styles.infoRow}>
              <Ionicons
                name="mail-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{studentData.email}</Text>
            </View>
          )}

          {studentData.mobile1 && (
            <View style={styles.infoRow}>
              <Ionicons
                name="call-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Mobile:</Text>
              <Text style={styles.infoValue}>{studentData.mobile1}</Text>
            </View>
          )}

          {studentData.mobile2 ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="people-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Parent Mobile:</Text>
              <Text style={styles.infoValue}>{studentData.mobile2}</Text>
            </View>
          ) : null}

          {studentData.gender ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="male-female-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Gender:</Text>
              <Text style={styles.infoValue}>{studentData.gender}</Text>
            </View>
          ) : null}

          {studentData.dob ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="balloon-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>DOB:</Text>
              <Text style={styles.infoValue}>
                {formatDate(studentData.dob)}
              </Text>
            </View>
          ) : null}

          {studentData.currentAddress ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Current Address:</Text>
              <Text style={styles.infoValue}>{studentData.currentAddress}</Text>
            </View>
          ) : null}

          {studentData.permanentAddress ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="home-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Permanent Address:</Text>
              <Text style={styles.infoValue}>
                {studentData.permanentAddress}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Financial & Account Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Account & Payment Info</Text>

          {studentData.paymentMode && (
            <View style={styles.infoRow}>
              <Ionicons
                name="card-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Payment Mode:</Text>
              <Text style={styles.infoValue}>{studentData.paymentMode}</Text>
            </View>
          )}

          {studentData.branchCode && (
            <View style={styles.infoRow}>
              <Ionicons
                name="business-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Branch Code:</Text>
              <Text style={styles.infoValue}>{studentData.branchCode}</Text>
            </View>
          )}

          {studentData.sourceBy && (
            <View style={styles.infoRow}>
              <Ionicons
                name="compass-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Source:</Text>
              <Text style={styles.infoValue}>{studentData.sourceBy}</Text>
            </View>
          )}

          {studentData.reference && (
            <View style={styles.infoRow}>
              <Ionicons
                name="link-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Reference Code:</Text>
              <Text style={styles.infoValue}>{studentData.reference}</Text>
            </View>
          )}

          {studentData.remark ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Remark:</Text>
              <Text style={styles.infoValue}>{studentData.remark}</Text>
            </View>
          ) : null}
        </View>

        {/* Verification Card */}
        {studentData.aadhaarCardNo && (
          <View style={styles.card}>
            <Text style={styles.sectionHeaderTitle}>Verification</Text>

            <View style={styles.infoRow}>
              <Ionicons
                name="finger-print-outline"
                size={16}
                color="#64748b"
                style={styles.rowIcon}
              />
              <Text style={styles.infoLabel}>Aadhaar No:</Text>
              <Text style={styles.infoValue}>
                {showAadhaar
                  ? studentData.aadhaarCardNo
                  : `•••• •••• ${studentData.aadhaarCardNo.slice(-4)}`}
              </Text>
              <TouchableOpacity onPress={() => setShowAadhaar(!showAadhaar)}>
                <Ionicons
                  name={showAadhaar ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#6366F1"
                />
              </TouchableOpacity>
            </View>
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
    height: 52,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  shareBtn: {
    padding: 4,
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
    marginBottom: 12,
    fontSize: 14,
    color: '#ef4444',
  },
  retryBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: '#6366F1',
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
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  regRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  regSubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  regValue: {
    color: '#1e293b',
    fontWeight: '700',
  },
  copyIconBtn: {
    marginLeft: 6,
    padding: 2,
  },
  rollText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    marginBottom: 6,
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
  mediumPill: {
    backgroundColor: '#e0f2fe',
  },
  mediumPillText: {
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
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  feeHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  feeSubText: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
  },
  miniTrack: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  miniFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803d',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  batchSubText: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
  },
  subjectChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  miniChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniChipText: {
    fontSize: 9,
    color: '#4338ca',
    fontWeight: '600',
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
    width: 110,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
});

export default StudentProfile;
