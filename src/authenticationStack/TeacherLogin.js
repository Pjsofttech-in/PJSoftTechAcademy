import React, {useState, useEffect, useRef} from 'react';
import {
  Alert,
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {loginTeacher, checkTokenValidity} from '../util/Apicall';
import {useAuth} from '../auth/AuthContext';

const {width, height} = Dimensions.get('window');

const TeacherLogin = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {role} = route.params || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const {login} = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;

  const dashboardMap = {
    teacher: 'TeacherDashboard',
    student: 'SDashboard',
    parent: 'PDashboard',
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
          await login(result, role);
          navigation.reset({
            index: 0,
            routes: [{name: dashboardMap[role] || 'Role'}],
          });
        }
      }
    };
    tryAutoLogin();
  }, []);

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
      const result = await loginTeacher(email, password, role);
      const loginSuccess = await login(result, role);
      if (loginSuccess) {
        navigation.reset({
          index: 0,
          routes: [{name: dashboardMap[role] || 'Role'}],
        });
      } else {
        showError('Login failed. Please try again.');
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
          <Text style={styles.roleBadgeIcon}>👨‍🏫</Text>
          <Text style={styles.roleBadgeText}>Teacher Portal</Text>
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your classroom dashboard
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
                placeholder="you@gmail.com"
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
                onPress={() =>
                  Alert.alert(
                    'Reset Password',
                    'Password reset link will be sent to your registered email.',
                  )
                }
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

          {/* Footer hint */}
          <View style={styles.footerHint}>
            <Text style={styles.footerHintText}>Not a teacher? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerHintLink}>Change role</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default TeacherLogin;

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
    fontFamily: 'Poppins-Regular',
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

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorIcon: {
    fontSize: 13,
    color: '#D93025',
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    color: '#D93025',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },

  // Fields
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
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
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
    color: '#6366f1',
  },

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
    fontFamily: 'DMSans-Bold',
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
    fontFamily: 'DMSans-Bold',
    letterSpacing: 0.5,
  },

  // Footer
  footerHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  footerHintText: {
    fontSize: 12,
    color: '#9AAABB',
  },
  footerHintLink: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
