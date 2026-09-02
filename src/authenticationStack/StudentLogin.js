import React, {useState, useEffect, useRef} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  loginStudent,
  checkTokenValidity,
  sendOtp,
  resetUserPassword,
} from '../util/Apicall';
import {useAuth} from '../auth/AuthContext';

const {height} = Dimensions.get('window');

// ─── Forgot Password Modal ────────────────────────────────────────────────────

const ForgotPasswordModal = ({visible, onClose}) => {
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [step, setStep] = useState(1);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.94)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setResetEmail('');
      setOtp('');
      setNewPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setStep(1);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.94,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setResetEmail('');
      setOtp('');
      setNewPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setStep(1);
      onClose();
    });
  };

  const showErr = msg => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const showOk = msg => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleSendOTP = async () => {
    if (!resetEmail) return showErr('Please enter your email address.');
    if (!resetEmail.includes('@'))
      return showErr('Enter a valid email address.');
    setIsLoading(true);
    try {
      const result = await sendOtp(resetEmail);
      if (result.success) {
        showOk(`OTP sent to ${resetEmail}`);
        setStep(2);
      } else {
        showErr(result.message || 'Failed to send OTP.');
      }
    } catch (e) {
      showErr(e.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword)
      return showErr('Enter both OTP and new password.');
    if (newPassword.length < 3)
      return showErr('Password must be at least 3 characters.');
    setIsLoading(true);
    try {
      const result = await resetUserPassword({
        email: resetEmail,
        otp,
        newPassword,
      });
      if (result.success) {
        showOk('Password reset successfully! You can now sign in.');
        setTimeout(closeModal, 2000);
      } else {
        showErr(result.message || 'Failed to reset password.');
      }
    } catch (e) {
      showErr(e.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeModal}>
      <Animated.View style={[styles.modalBackdrop, {opacity: backdropOpacity}]}>
        <Animated.View
          style={[
            styles.modalBox,
            {opacity: modalOpacity, transform: [{scale: modalScale}]},
          ]}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <View style={{flex: 1}}>
              <Text style={styles.modalTitle}>
                {step === 1 ? 'Reset Password' : 'Set New Password'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {step === 1
                  ? 'Enter your registered email to receive an OTP'
                  : 'Enter the OTP sent to your email and choose a new password'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeModal}
              style={styles.modalCloseBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Messages */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Step 1 */}
          {step === 1 && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#B0BCCA"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
                activeOpacity={0.85}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>One-time password (OTP)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#B0BCCA"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>New password</Text>
                <View style={[styles.passwordRow]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#B0BCCA"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(v => !v)}
                    style={styles.toggleBtn}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Text style={styles.toggleText}>
                      {showNewPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.85}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backLinkRow}>
                <Text style={styles.backLinkText}>‹ Back to email</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── StudentLogin ─────────────────────────────────────────────────────────────

const StudentLogin = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {role} = route.params || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const {login} = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;

  const dashboardMap = {
    student: 'StudentNavigator',
    teacher: 'TeacherNavigator',
    parent: 'StudentNavigator',
  };

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    const tryAutoLogin = async () => {
      const storedToken = await AsyncStorage.getItem(`${role}Token`);
      if (storedToken) {
        const valid = await checkTokenValidity(storedToken);
        if (valid) {
          const result = {token: storedToken};
          if (role === 'user') {
            try {
              const storedStudentData = await AsyncStorage.getItem(
                `${role}Data`,
              );
              if (storedStudentData) {
                result.studentData = JSON.parse(storedStudentData);
              } else {
                await AsyncStorage.removeItem(`${role}Token`);
                return;
              }
            } catch {
              await AsyncStorage.removeItem(`${role}Token`);
              await AsyncStorage.removeItem('studentData');
              return;
            }
          }
          await login(result, role);
          if (role === 'user') {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: dashboardMap[role],
                  params: {studentData: result.studentData},
                },
              ],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{name: dashboardMap[role] || 'Role'}],
            });
          }
        } else {
          await AsyncStorage.removeItem(`${role}Token`);
          if (role === 'user') await AsyncStorage.removeItem('studentData');
        }
      }
    };
    if (role) tryAutoLogin();
  }, [role]);

  const showError = message => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      showError('Enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await loginStudent(email, password);
      const studentData = result?.studentData;

      if (
        !studentData?.id ||
        !studentData?.formId ||
        !studentData?.admissionId ||
        !studentData?.branchCode
      ) {
        showError(
          'Login response missing student details. Please contact support.',
        );
        return;
      }

      try {
        await AsyncStorage.setItem('studentData', JSON.stringify(studentData));
      } catch {
        showError('Failed to store student data.');
        return;
      }

      const loginSuccess = await login(
        {token: result.token, userData: studentData},
        role,
      );
      if (loginSuccess) {
        if (role === 'user') {
          navigation.reset({
            index: 0,
            routes: [{name: dashboardMap[role], params: {studentData}}],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{name: dashboardMap[role] || 'Role'}],
          });
        }
      } else {
        showError('Failed to process login response.');
      }
    } catch (err) {
      showError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Dynamic Top Header with Safe Area Inset */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            paddingTop: insets.top + 20,
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeIcon}>🎓</Text>
          <Text style={styles.roleBadgeText}>Student Portal</Text>
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your courses, assignments and results
        </Text>
      </Animated.View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {paddingBottom: insets.bottom + 24},
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              {opacity: cardAnim, transform: [{translateY: cardSlide}]},
            ]}>
            {/* Error */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'email' && styles.inputFocused,
                ]}
                placeholder="you@school.edu"
                placeholderTextColor="#B0BCCA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View
                style={[
                  styles.passwordRow,
                  focusedField === 'password' && styles.inputFocused,
                ]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#B0BCCA"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  disabled={isLoading}
                  style={styles.toggleBtn}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={styles.toggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <View style={styles.forgotRow}>
              <TouchableOpacity
                onPress={() => setShowForgotModal(true)}
                activeOpacity={0.6}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footerHint}>
            <Text style={styles.footerHintText}>Not a student? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerHintLink}>Change role</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </View>
  );
};

export default StudentLogin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  // Scroll
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Header
  headerSection: {
    paddingBottom: 40,
    paddingHorizontal: 22,
    backgroundColor: '#6495ED',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6495ED',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fff',
  },
  roleBadgeIcon: {
    fontSize: 13,
    marginRight: 5,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 5,
  },
  roleBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 23,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    lineHeight: 19,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A2332',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginTop: -25,
  },

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  errorIcon: {fontSize: 12, color: '#D93025', marginTop: 1},
  errorText: {
    flex: 1,
    color: '#D93025',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    lineHeight: 18,
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FBF4',
    borderWidth: 1,
    borderColor: '#A8DDB8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  successIcon: {fontSize: 12, color: '#1A7A4A', marginTop: 1},
  successText: {
    flex: 1,
    color: '#1A7A4A',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    lineHeight: 18,
  },

  // Fields
  fieldGroup: {marginBottom: 18},
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#3D4F62',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#D8E3EE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#1A2332',
  },
  inputFocused: {
    borderColor: '#6366f1',
    backgroundColor: '#f3f3ff',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#D8E3EE',
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 6,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: '#1A2332',
  },
  toggleBtn: {paddingHorizontal: 10, paddingVertical: 8},
  toggleText: {fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#6366f1'},

  // Forgot
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 16,
  },
  forgotText: {
    fontSize: 12,
    color: '#000080',
    fontFamily: 'Poppins-SemiBold',
  },

  // Login button
  loginBtn: {
    backgroundColor: '#6495ED',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#6495ED',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnDisabled: {
    backgroundColor: '#bbbcf3',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
  },

  // Footer
  footerHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  footerHintText: {fontSize: 12, color: '#9AAABB'},
  footerHintLink: {
    fontSize: 12,
    color: '#6366f1',
    fontFamily: 'Poppins-SemiBold',
    textDecorationLine: 'underline',
  },

  // ── Forgot Password Modal ──────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 30, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A2332',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A2332',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7A8D',
    lineHeight: 17,
    maxWidth: '85%',
  },
  modalCloseBtn: {padding: 4},
  modalCloseIcon: {
    fontSize: 15,
    color: '#9AAABB',
    fontFamily: 'Poppins-SemiBold',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },

  // Modal shared field/button styles
  primaryBtn: {
    backgroundColor: '#1A7A4A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#1A7A4A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {opacity: 0.55},
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.4,
  },
  backLinkRow: {alignItems: 'center', paddingTop: 16},
  backLinkText: {
    fontSize: 12,
    color: '#000080',
    fontFamily: 'Poppins-SemiBold',
  },
});
