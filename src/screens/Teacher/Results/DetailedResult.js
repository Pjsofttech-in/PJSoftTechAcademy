import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import ExamPaperTypeSelector from '../../../components/ExamPaperTypeSelector';
import Icon from 'react-native-vector-icons/Feather';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../../auth/AuthContext';
import {
  fetchAdmissionListByTeacher,
  fetchTopicNamesByTeacher,
  getTopicIdByName,
  fetchStudentResultsByTeacher,
  submitStudentSubjectResult,
} from '../../../util/Apicall';

// ── Theme Palette ─────────────────────────────────────────────────────────────
const P = {
  brand: '#6366f1',
  brandLight: '#F5F3FF',
  brandMid: '#DDD6FE',
  brandBold: '#4F46E5',
  text: '#0F172A',
  sub: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
};

const AVATAR_COLORS = [
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
];

// ── Custom Alert ──────────────────────────────────────────────────────────────
const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const MAP = {
    success: {icon: 'check-circle', color: '#10B981', bg: '#D1FAE5'},
    error: {icon: 'x-circle', color: '#EF4444', bg: '#FEE2E2'},
    warning: {icon: 'alert-triangle', color: '#F59E0B', bg: '#FEF3C7'},
  };
  const {icon, color, bg} = MAP[type] || {
    icon: 'info',
    color: P.brand,
    bg: P.brandLight,
  };

  if (!visible) return null;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent>
      <Animated.View style={[S.alertOverlay, {opacity: fadeAnim}]}>
        <Animated.View style={[S.alertBox, {transform: [{scale: scaleAnim}]}]}>
          <View style={[S.alertIcon, {backgroundColor: bg}]}>
            <Icon name={icon} size={32} color={color} />
          </View>
          <View style={S.alertBody}>
            <Text style={S.alertTitle}>{title}</Text>
            <Text style={S.alertMsg}>{message}</Text>
          </View>
          <View style={S.alertBtns}>
            {showCancel && (
              <TouchableOpacity
                style={[S.alertBtn, S.cancelBtn]}
                onPress={onCancel}>
                <Text style={S.cancelTxt}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                S.alertBtn,
                {
                  backgroundColor: color,
                  alignSelf: 'center',
                  flex: showCancel ? 1 : undefined,
                  marginLeft: showCancel ? 10 : 0,
                },
              ]}
              onPress={onConfirm}>
              <Text style={S.confirmTxt}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── Loading Modal ────────────────────────────────────────────────────────────
const LoadingModal = ({visible, message = 'Processing...'}) => {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const a = Animated.loop(
        Animated.timing(rot, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      );
      a.start();
      return () => a.stop();
    }
  }, [visible]);

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={S.loadOverlay}>
        <View style={S.loadBox}>
          <Animated.View style={{transform: [{rotate}]}}>
            <Icon name="loader" size={32} color={P.brand} />
          </Animated.View>
          <Text style={S.loadTxt}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

// ── Custom Pill Dropdown Component ───────────────────────────────────────────
const PillDropdown = ({
  label,
  icon,
  value,
  displayLabel,
  items,
  onSelect,
  disabled,
}) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  const [pos, setPos] = useState({x: 0, y: 0, width: 0});
  const hAnim = useRef(new Animated.Value(0)).current;
  const oAnim = useRef(new Animated.Value(0)).current;

  const open = () => {
    if (disabled) return;
    ref.current?.measure((x, y, w, h, px, py) => {
      const ih = 44;
      const max = Math.min((items.length + 1) * ih, 5 * ih);
      setPos({x: px, y: py + h + 4, width: Math.max(w, 160)});
      hAnim.setValue(0);
      oAnim.setValue(0);
      setVis(true);
      Animated.parallel([
        Animated.timing(hAnim, {
          toValue: Math.max(max, ih * 2),
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(oAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(hAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: false,
      }),
      Animated.timing(oAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start(() => setVis(false));
  };

  const sel = !!value;
  return (
    <>
      <Pressable
        ref={ref}
        style={[S.pill, sel && S.pillOn, disabled && S.pillOff]}
        onPress={open}>
        <Ionicons
          name={icon}
          size={13}
          color={sel ? '#fff' : disabled ? '#94A3B8' : P.sub}
          style={{marginRight: 4}}
        />
        <Text
          style={[S.pillTxt, sel && S.pillTxtOn, disabled && S.pillTxtOff]}
          numberOfLines={1}>
          {displayLabel || label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={12}
          color={sel ? '#fff' : disabled ? '#94A3B8' : P.sub}
          style={{marginLeft: 4}}
        />
      </Pressable>

      {vis && (
        <Modal transparent visible onRequestClose={close}>
          <Pressable
            style={{flex: 1, backgroundColor: 'rgba(15,23,42,0.08)'}}
            onPress={close}>
            <Animated.View
              style={[
                S.dropList,
                {
                  top: pos.y,
                  left: pos.x,
                  width: pos.width,
                  height: hAnim,
                  opacity: oAnim,
                },
              ]}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator
                style={{flex: 1}}>
                <Pressable
                  style={S.dropItem}
                  onPress={() => {
                    onSelect(null);
                    close();
                  }}>
                  <Text style={S.dropTxt}>All</Text>
                </Pressable>
                {items.map((item, idx) => {
                  const lbl =
                    item.label || item.batchName || item.subjectName || item;
                  const val = item.value ?? item.id ?? item;
                  const isSel = String(value) === String(val);
                  return (
                    <Pressable
                      key={item.id || idx}
                      style={[S.dropItem, isSel && S.dropItemOn]}
                      onPress={() => {
                        onSelect(val, item);
                        close();
                      }}>
                      <Text style={[S.dropTxt, isSel && S.dropTxtOn]}>
                        {lbl}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </>
  );
};

// ── Add Marks Bottom Sheet ────────────────────────────────────────────────────
const AddMarksSheet = ({
  visible,
  student,
  onClose,
  onSubmit,
  marksInput,
  totalMarks,
  onMarksChange,
  isSubmitting,
  selectedTopic,
  subjectName,
}) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 68,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !student) return null;
  const bg = AVATAR_COLORS[(student.id || 0) % AVATAR_COLORS.length];
  const initial = (student.name || 'S').charAt(0).toUpperCase();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[S.sheetOverlay, {opacity: fadeAnim}]}>
          <Pressable style={{flex: 1}} onPress={onClose} />
          <Animated.View
            style={[S.sheetBox, {transform: [{translateY: slideAnim}]}]}>
            <View style={S.sheetHandle} />

            {/* Student details */}
            <View style={S.sheetHead}>
              {student.studentImage ? (
                <Image
                  source={{uri: student.studentImage}}
                  style={[S.sheetAvatar, {borderRadius: 22}]}
                />
              ) : (
                <View
                  style={[
                    S.sheetAvatar,
                    {
                      backgroundColor: bg,
                      borderRadius: 22,
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}>
                  <Text style={S.sheetAvatarTxt}>{initial}</Text>
                </View>
              )}
              <View style={{flex: 1}}>
                <Text style={S.sheetName} numberOfLines={1}>
                  {student.name}
                </Text>
                <Text style={S.sheetRoll}>
                  Roll No: {student.rollNo || '-'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={S.sheetClose}
                activeOpacity={0.7}>
                <Icon name="x" size={18} color={P.sub} />
              </TouchableOpacity>
            </View>

            {/* Chips */}
            <View style={S.sheetChips}>
              <View style={S.sheetChip}>
                <Icon name="book-open" size={11} color={P.brand} />
                <Text style={S.sheetChipTxt} numberOfLines={1}>
                  {subjectName}
                </Text>
              </View>
              {!!selectedTopic && (
                <View
                  style={[
                    S.sheetChip,
                    {borderColor: P.brandMid, backgroundColor: P.brandLight},
                  ]}>
                  <Icon name="tag" size={11} color={P.brandBold} />
                  <Text
                    style={[S.sheetChipTxt, {color: P.brandBold}]}
                    numberOfLines={1}>
                    {selectedTopic}
                  </Text>
                </View>
              )}
            </View>

            {/* Total marks info box */}
            <View style={S.totalMarksBox}>
              <Text style={S.totalMarksLabel}>Maximum Score Limit</Text>
              <Text style={S.totalMarksVal}>{totalMarks}</Text>
            </View>

            {/* Input */}
            <Text style={S.sheetLabel}>Enter Obtained Marks</Text>
            <TextInput
              style={S.sheetInput}
              keyboardType="numeric"
              value={marksInput[student.id]?.toString() || ''}
              onChangeText={t => onMarksChange(student.id, t)}
              placeholder="e.g. 85"
              placeholderTextColor="#A5B4FC"
              editable={!isSubmitting}
              autoFocus
              returnKeyType="done"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[S.sheetSubmit, isSubmitting && {opacity: 0.6}]}
              onPress={() => onSubmit(student)}
              disabled={isSubmitting}
              activeOpacity={0.85}>
              <Icon
                name={isSubmitting ? 'clock' : 'check-circle'}
                size={18}
                color="#fff"
              />
              <Text style={S.sheetSubmitTxt}>
                {isSubmitting ? 'Submitting…' : 'Submit Marks'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Student Card (ERP Matrix Style) ─────────────────────────────────────────
const StudentCard = ({admission, result, onAddMarks}) => {
  const bg = AVATAR_COLORS[(admission.id || 0) % AVATAR_COLORS.length];
  const initial = (admission.name || 'S').charAt(0).toUpperCase();

  const totalObtained = result?.totalObtainedMarks;
  const totalMarks = result?.totalSubjectMarks;
  const pct = result?.percentage;
  const status = result?.status;
  const isPass = status?.toLowerCase() === 'pass';

  const subjectRows = result?.subjectResults || [];

  return (
    <View style={S.card}>
      {/* ── Header ── */}
      <View style={S.cardHead}>
        {admission.studentImage ? (
          <Image source={{uri: admission.studentImage}} style={S.avatar} />
        ) : (
          <View style={[S.avatar, {backgroundColor: bg}]}>
            <Text style={S.avatarTxt}>{initial}</Text>
          </View>
        )}
        <View style={{flex: 1}}>
          <Text style={S.cardName} numberOfLines={1}>
            {admission.name}
          </Text>
          <Text style={S.cardMeta}>
            Roll No: {admission.rollNo || '-'} · {admission.coursename || ''}
          </Text>
        </View>
      </View>

      {/* ── Aggregated Summary Strip ── */}
      {totalObtained != null && totalMarks != null && (
        <View style={S.summaryBar}>
          <Text style={S.summaryLabel}>Aggregated Score:</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={S.summaryVal}>
              {totalObtained}/{totalMarks}
            </Text>
            {pct != null && (
              <Text style={S.summaryPct}> ({pct.toFixed(1)}%)</Text>
            )}
          </View>
        </View>
      )}

      {/* ── 2-Column Topic Grid ── */}
      <View style={S.gridContainer}>
        {subjectRows.length > 0 ? (
          subjectRows.map((sr, i) => (
            <View key={sr.id ?? i} style={S.gridTile}>
              <Text style={S.gridTopicName} numberOfLines={1}>
                {sr.topicName || sr.subjectName || '-'}
              </Text>
              <View style={S.gridScoreRow}>
                <Text style={S.gridObtained}>{sr.obtainedMarks ?? '-'}</Text>
                <Text style={S.gridTotal}>/{sr.totalMarks ?? '-'}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={S.emptyGridTile}>
            <Text style={S.emptyGridTxt}>No marks recorded yet</Text>
          </View>
        )}
      </View>

      {/* ── ERP Action & Status Strip Footer ── */}
      <View style={S.cardFooter}>
        {status ? (
          <View
            style={[
              S.badge,
              {
                backgroundColor: isPass ? '#ECFDF5' : '#FFF1F2',
                borderColor: isPass ? '#A7F3D0' : '#FECDD3',
              },
            ]}>
            <View
              style={[
                S.statusDot,
                {backgroundColor: isPass ? '#10B981' : '#F43F5E'},
              ]}
            />
            <Text style={[S.badgeTxt, {color: isPass ? '#047857' : '#BE123C'}]}>
              {status.toUpperCase()}
            </Text>
          </View>
        ) : (
          <View style={{flex: 1}} />
        )}

        <TouchableOpacity
          style={S.addBtn}
          onPress={() => onAddMarks(admission)}
          activeOpacity={0.8}>
          <Icon name="plus" size={14} color={P.brand} />
          <Text style={S.addBtnTxt}>Enter Marks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Info Banner ─────────────────────────────────────────────────────────────
const InfoBanner = ({
  selectedTopic,
  selectedSubject,
  subjectList,
  selectedBatch,
  batchList,
}) => {
  if (!selectedTopic) return null;
  const subName = subjectList.find(
    s => String(s.id) === String(selectedSubject),
  )?.subjectName;
  const batchName = batchList.find(
    b => String(b.id) === String(selectedBatch),
  )?.batchName;

  return (
    <View style={S.banner}>
      <Icon name="info" size={13} color={P.brand} />
      <Text style={S.bannerTxt} numberOfLines={1}>
        {[batchName, subName, selectedTopic].filter(Boolean).join('  ›  ')}
      </Text>
    </View>
  );
};

// ── Main Screen ─────────────────────────────────────────────────────────────
const DetailedResult = ({userData: propUserData, route}) => {
  const {userData: authUserData} = useAuth();
  const [resolvedUserData, setResolvedUserData] = useState(
    propUserData || route?.params?.userData || authUserData || null,
  );

  const [selectedExamType, setSelectedExamType] = useState(null);
  const [selectedPaperType, setSelectedPaperType] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batchList, setBatchList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectList, setSubjectList] = useState([]);
  const [topicList, setTopicList] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [subjectDetailsId, setSubjectDetailsId] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [marksInput, setMarksInput] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sheet state
  const [sheetStudent, setSheetStudent] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Alert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const userData = resolvedUserData;
  const teacherRole =
    userData?.role === 'branch' ? 'teacher' : userData?.role || 'teacher';
  const [loading, setLoading] = useState(true);

  // ── Resolve user data ────────────────────────────────────────────────────
  useEffect(() => {
    const incoming =
      propUserData || route?.params?.userData || authUserData || null;
    if (incoming) {
      setResolvedUserData(incoming);
      return;
    }
    (async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        for (const key of [
          storedRole ? `${storedRole}Data` : null,
          'teacherData',
          'userData',
        ].filter(Boolean)) {
          const s = await AsyncStorage.getItem(key);
          if (s) {
            const p = JSON.parse(s);
            setResolvedUserData({
              ...p,
              role: p.role || storedRole || 'teacher',
            });
            return;
          }
        }
      } catch {}
    })();
  }, [propUserData, route?.params?.userData, authUserData]);

  const showAlert = cfg => {
    setAlertConfig(cfg);
    setAlertVisible(true);
  };

  // ── Fetch Admissions ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!userData?.email || !userData?.branchCode) return;

        const admData = await fetchAdmissionListByTeacher(
          userData.email,
          userData.branchCode,
          teacherRole,
        );

        setAdmissions(admData || []);

        const classrooms = (admData || [])
          .map(a => a.admissionClassRoom)
          .filter(r => r?.id)
          .reduce((acc, r) => {
            if (!acc.find(x => x.id === r.id)) acc.push(r);
            return acc;
          }, []);
        setBatchList(classrooms);

        const subs = [];
        (admData || []).forEach(a => {
          (a.admissionClassRoom?.subjects || a.subjects || []).forEach(s => {
            if (s?.subjectName?.trim() && !subs.find(x => x.id === s.id))
              subs.push(s);
          });
        });
        setSubjectList(subs.filter(s => s?.subjectName?.trim()));
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userData?.email, userData?.branchCode, teacherRole]);

  // ── Fetch Student Results ────────────────────────────────────────────────
  const refreshStudentResults = async () => {
    try {
      if (!userData?.email || !userData?.branchCode || !userData?.role) return;
      const results = await fetchStudentResultsByTeacher(
        teacherRole,
        userData.email,
        userData.branchCode,
      );
      setStudentResults(results || []);
    } catch {}
  };

  useEffect(() => {
    refreshStudentResults();
  }, [userData?.email, userData?.branchCode, userData?.role]);

  // ── Fetch Topics ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (
        selectedBatch &&
        selectedSubject &&
        selectedExamType?.id &&
        selectedPaperType?.id &&
        userData?.email
      ) {
        try {
          const topics = await fetchTopicNamesByTeacher({
            classroomId: selectedBatch,
            subjectId: selectedSubject,
            examTypeId: selectedExamType.id,
            paperTypeId: selectedPaperType.id,
            role: teacherRole,
            email: userData.email,
          });
          setTopicList(topics);
        } catch {
          setTopicList([]);
        }
      } else {
        setTopicList([]);
      }
    })();
  }, [
    selectedBatch,
    selectedSubject,
    selectedExamType,
    selectedPaperType,
    userData?.email,
    teacherRole,
  ]);

  // ── Submit Marks ──────────────────────────────────────────────────────────
  const handleSubmitMarks = async student => {
    try {
      if (!selectedTopic) {
        showAlert({
          title: 'Select Topic',
          message: 'Please select a topic from filters first.',
          type: 'warning',
          onConfirm: () => setAlertVisible(false),
        });
        return;
      }
      if (!subjectDetailsId) {
        showAlert({
          title: 'Invalid Topic',
          message: 'Topic reference not found.',
          type: 'warning',
          onConfirm: () => setAlertVisible(false),
        });
        return;
      }
      const marks = marksInput[student.id];
      if (!marks?.toString().trim()) {
        showAlert({
          title: 'Enter Marks',
          message: 'Please enter marks before submitting.',
          type: 'warning',
          onConfirm: () => setAlertVisible(false),
        });
        return;
      }
      const marksNum = Number(marks);
      const topicResult = studentResults
        .find(r => Number(r.studentId) === Number(student.id))
        ?.subjectResults?.find(
          s => (s.topicName || s.subjectName) === selectedTopic,
        );

      const totalMarks = topicResult?.totalMarks;

      if (totalMarks != null && marksNum > Number(totalMarks)) {
        showAlert({
          title: 'Invalid Marks',
          message: `Obtained marks cannot exceed maximum of ${totalMarks}.`,
          type: 'warning',
          onConfirm: () => setAlertVisible(false),
        });
        return;
      }
      if (isNaN(marksNum)) {
        showAlert({
          title: 'Invalid Input',
          message: 'Please enter valid numerical marks.',
          type: 'error',
          onConfirm: () => setAlertVisible(false),
        });
        return;
      }

      setIsSubmitting(true);
      const payload = [
        {
          examType: {id: selectedExamType.id},
          obtainedMarks: marksNum,
          paperType: {id: selectedPaperType.id},
          student: {id: student.id},
          subjectDetails: {id: subjectDetailsId},
        },
      ];
      const response = await submitStudentSubjectResult(
        payload,
        userData.email,
        userData.role === 'branch' ? 'teacher' : userData.role,
      );

      const ok =
        response &&
        (response.success === true ||
          response.status === 'success' ||
          response.statusCode === 200 ||
          response.message?.toLowerCase().includes('success') ||
          (Array.isArray(response) && response.length > 0) ||
          (!response.error &&
            !response.message?.toLowerCase().includes('error')));

      if (ok) {
        setSheetVisible(false);
        showAlert({
          title: 'Success!',
          message: `Marks recorded for ${student.name}.`,
          type: 'success',
          onConfirm: async () => {
            setAlertVisible(false);
            setMarksInput(p => ({...p, [student.id]: ''}));
            await refreshStudentResults();
          },
        });
      } else {
        showAlert({
          title: 'Submission Failed',
          message: response?.message || 'Failed to submit marks.',
          type: 'error',
          onConfirm: () => setAlertVisible(false),
        });
      }
    } catch (e) {
      showAlert({
        title: 'Error',
        message: e.message || 'An error occurred while submitting.',
        type: 'error',
        onConfirm: () => setAlertVisible(false),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSheet = student => {
    setSheetStudent(student);
    setSheetVisible(true);
  };

  const batchDisplayLabel = batchList.find(
    b => String(b.id) === String(selectedBatch),
  )?.batchName;
  const subjectDisplayLabel = subjectList.find(
    s => String(s.id) === String(selectedSubject),
  )?.subjectName;
  const subjectName = subjectDisplayLabel || 'Subject';

  const batchReady = !!selectedBatch;
  const subjectReady =
    !!selectedBatch &&
    !!selectedSubject &&
    !!selectedExamType &&
    !!selectedPaperType;

  if (loading) {
    return (
      <View style={S.centerLoading}>
        <ActivityIndicator size="large" color={P.brand} />
        <Text style={S.loadingTxt}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={S.container}>
      {/* ── ERP Multi-Row Filter Controls ── */}
      <View style={S.filterBar}>
        <View style={S.filterRow}>
          <ExamPaperTypeSelector
            onExamTypeChange={setSelectedExamType}
            onPaperTypeChange={setSelectedPaperType}
            customTextStyle={{}}
          />
        </View>

        <View style={S.filterRowPills}>
          <PillDropdown
            label="Batch"
            icon="grid-outline"
            value={selectedBatch}
            displayLabel={batchDisplayLabel}
            items={batchList.map(b => ({
              id: b.id,
              label: b.batchName,
              value: b.id,
            }))}
            onSelect={v => setSelectedBatch(v || '')}
          />
          <PillDropdown
            label="Subject"
            icon="book-outline"
            value={selectedSubject}
            displayLabel={subjectDisplayLabel}
            items={subjectList.map(s => ({
              id: s.id,
              label: s.subjectName,
              value: s.id,
            }))}
            onSelect={v => {
              setSelectedSubject(v || '');
              setSelectedTopic('');
            }}
            disabled={!batchReady}
          />
          <PillDropdown
            label="Topic"
            icon="layers-outline"
            value={selectedTopic}
            displayLabel={selectedTopic || null}
            items={topicList.map((t, i) => ({id: i, label: t, value: t}))}
            onSelect={async v => {
              setSelectedTopic(v || '');
              if (v) {
                try {
                  const id = await getTopicIdByName(
                    v,
                    userData.email,
                    teacherRole,
                  );
                  setSubjectDetailsId(id || null);
                } catch {
                  setSubjectDetailsId(null);
                }
              } else {
                setSubjectDetailsId(null);
              }
            }}
            disabled={!subjectReady}
          />
        </View>
      </View>

      {/* ── Context Info Banner ── */}
      <InfoBanner
        selectedTopic={selectedTopic}
        selectedSubject={selectedSubject}
        subjectList={subjectList}
        selectedBatch={selectedBatch}
        batchList={batchList}
      />

      {/* ── Student List (Cards) ── */}
      <FlatList
        data={
          selectedBatch
            ? admissions.filter(
                item =>
                  String(item.admissionClassRoom?.id) === String(selectedBatch),
              )
            : admissions
        }
        keyExtractor={(item, idx) => String(item.id || idx)}
        contentContainerStyle={S.cardList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <Icon name="users" size={40} color="#C4B5FD" />
            <Text style={S.emptyTxt}>No students found</Text>
          </View>
        }
        renderItem={({item: admission}) => {
          const result = studentResults.find(
            r => Number(r.studentId) === Number(admission.id),
          );
          return (
            <StudentCard
              admission={admission}
              result={result}
              onAddMarks={openSheet}
            />
          );
        }}
      />

      {/* ── Add Marks Sheet ── */}
      <AddMarksSheet
        visible={sheetVisible}
        student={sheetStudent}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleSubmitMarks}
        marksInput={marksInput}
        onMarksChange={(id, text) => setMarksInput(p => ({...p, [id]: text}))}
        isSubmitting={isSubmitting}
        selectedTopic={selectedTopic}
        subjectName={subjectName}
        totalMarks={
          studentResults
            .find(r => Number(r.studentId) === Number(sheetStudent?.id))
            ?.subjectResults?.find(
              s => (s.topicName || s.subjectName) === selectedTopic,
            )?.totalMarks ?? '-'
        }
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
      <LoadingModal visible={isSubmitting} message="Submitting marks…" />
    </View>
  );
};

export default DetailedResult;

// ── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: {flex: 1, backgroundColor: P.bg},
  centerLoading: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingTxt: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: P.sub,
  },

  // Structured Multi-Row Filter Header
  filterBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    elevation: 2,
    shadowColor: P.text,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterRowPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Pills
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.brandLight,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: P.brandMid,
  },
  pillOn: {backgroundColor: P.brand, borderColor: P.brand},
  pillOff: {backgroundColor: '#F1F5F9', borderColor: '#CBD5E1'},
  pillTxt: {
    fontSize: 12,
    color: P.sub,
    fontFamily: 'DMSans-Medium',
    maxWidth: 90,
  },
  pillTxtOn: {color: '#fff'},
  pillTxtOff: {color: '#94A3B8'},

  // Dropdown List
  dropList: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    elevation: 8,
    overflow: 'hidden',
    shadowColor: P.text,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 44,
    justifyContent: 'center',
  },
  dropItemOn: {backgroundColor: P.brandLight},
  dropTxt: {fontSize: 13, color: P.text, fontFamily: 'DMSans-Medium'},
  dropTxtOn: {color: P.brand, fontFamily: 'DMSans-Bold'},

  // Info Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.brandLight,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: P.brandMid,
  },
  bannerTxt: {
    fontSize: 11,
    color: P.brandBold,
    fontFamily: 'DMSans-Medium',
    flex: 1,
  },

  // Card List Container
  cardList: {padding: 16, paddingBottom: 40},

  // Student Card Styling
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: P.text,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: P.border,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTxt: {fontSize: 16, color: '#fff', fontFamily: 'DMSans-Bold'},
  cardName: {
    fontSize: 14,
    color: P.text,
    fontFamily: 'DMSans-Bold',
  },
  cardMeta: {
    fontSize: 11,
    color: P.sub,
    fontFamily: 'DMSans-Medium',
    marginTop: 1,
  },

  // Summary Strip
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  summaryLabel: {fontSize: 11, color: '#64748B', fontFamily: 'DMSans-Medium'},
  summaryVal: {fontSize: 12, color: P.text, fontFamily: 'DMSans-Bold'},
  summaryPct: {fontSize: 11, color: P.brand, fontFamily: 'DMSans-Bold'},

  // Topic Grid (2 Columns)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  gridTile: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: P.border,
  },
  gridTopicName: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'DMSans-Medium',
    marginBottom: 4,
  },
  gridScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  gridObtained: {
    fontSize: 13,
    color: P.text,
    fontFamily: 'DMSans-Bold',
  },
  gridTotal: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'DMSans-Regular',
  },
  emptyGridTile: {
    width: '100%',
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderStyle: 'dashed',
  },
  emptyGridTxt: {
    fontSize: 12,
    color: '#A855F7',
    fontFamily: 'DMSans-Medium',
  },

  // Card Footer: Action & Status
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeTxt: {
    fontSize: 10,
    fontFamily: 'DMSans-Bold',
    letterSpacing: 0.4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: P.brandMid,
    backgroundColor: '#fff',
  },
  addBtnTxt: {
    fontSize: 11,
    color: P.brand,
    fontFamily: 'DMSans-Bold',
  },

  // Empty State
  empty: {alignItems: 'center', marginTop: 80, gap: 12},
  emptyTxt: {fontSize: 14, color: '#A5B4FC', fontFamily: 'DMSans-Medium'},

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheetBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    elevation: 16,
    shadowColor: P.text,
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: P.brandMid,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHead: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
  sheetAvatar: {width: 44, height: 44, marginRight: 12},
  sheetAvatarTxt: {fontSize: 18, color: '#fff', fontFamily: 'DMSans-Bold'},
  sheetName: {fontSize: 15, color: P.text, fontFamily: 'DMSans-Bold'},
  sheetRoll: {
    fontSize: 12,
    color: P.sub,
    fontFamily: 'DMSans-Medium',
    marginTop: 1,
  },
  sheetClose: {padding: 6},
  sheetChips: {flexDirection: 'row', gap: 8, marginBottom: 16},
  sheetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: P.brandLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: P.brandMid,
  },
  sheetChipTxt: {
    fontSize: 12,
    color: P.brand,
    fontFamily: 'DMSans-Medium',
    maxWidth: 130,
  },
  totalMarksBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalMarksLabel: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: '#4B5563',
  },
  totalMarksVal: {
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    color: P.brand,
  },
  sheetLabel: {
    fontSize: 13,
    color: P.sub,
    fontFamily: 'DMSans-Medium',
    marginBottom: 8,
  },
  sheetInput: {
    borderWidth: 1.5,
    borderColor: P.brandMid,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    color: P.text,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: P.brandLight,
  },
  sheetSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: P.brand,
    borderRadius: 12,
    paddingVertical: 14,
  },
  sheetSubmitTxt: {fontSize: 15, color: '#fff', fontFamily: 'DMSans-Bold'},

  // Alert Dialog
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  alertBody: {alignItems: 'center', marginBottom: 20},
  alertTitle: {
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
    color: P.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  alertMsg: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  alertBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {backgroundColor: '#F1F5F9', marginRight: 10},
  cancelTxt: {color: '#64748B', fontSize: 14, fontFamily: 'DMSans-Medium'},
  confirmTxt: {color: '#fff', fontSize: 14, fontFamily: 'DMSans-Bold'},

  // Overlay Spinner
  loadOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    elevation: 8,
  },
  loadTxt: {
    marginTop: 14,
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: '#64748B',
  },
});
