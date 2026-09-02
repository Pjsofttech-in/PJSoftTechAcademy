import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width, height} = Dimensions.get('window');

const ROLES = [
  {
    id: 'teacher',
    title: 'Teacher',
    subtitle: 'Manage classes, attendance & grades',
    icon: '👨‍🏫',
    accentColor: '#6366f1',
    borderColor: '#C7D9F0',
    bgColor: '#EBF2FB',
  },
  {
    id: 'student',
    title: 'Student',
    subtitle: 'View courses, assignments & results',
    icon: '🎓',
    accentColor: '#1A7A4A',
    borderColor: '#C2E8D4',
    bgColor: '#EAF7EF',
  },
  {
    id: 'parent',
    title: 'Parent',
    subtitle: "Track your child's progress & reports",
    icon: '👨‍👩‍👧',
    accentColor: '#7B3FA0',
    borderColor: '#DCC8EE',
    bgColor: '#F4EDF9',
  },
];

const RoleCard = ({role, isSelected, onPress, animDelay}) => {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(animDelay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePress = () => {
    onPress(role.id);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
      ]}>
      <TouchableOpacity
        style={[
          styles.roleCard,
          {
            backgroundColor: isSelected ? role.bgColor : '#FFFFFF',
            borderColor: isSelected ? role.accentColor : '#E2E8F0',
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}>
        <View
          style={[styles.accentStripe, {backgroundColor: role.accentColor}]}
        />

        <View style={[styles.iconBox, {backgroundColor: role.bgColor}]}>
          <Text style={styles.iconText}>{role.icon}</Text>
        </View>

        <View style={styles.cardText}>
          <Text style={[styles.roleTitle, {color: role.accentColor}]}>
            {role.title}
          </Text>
          <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
        </View>

        <View style={styles.chevronContainer}>
          <Text
            style={[
              styles.chevron,
              {color: isSelected ? role.accentColor : '#BEC8D4'},
            ]}>
            ›
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ComingSoonModal = ({visible, onClose}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 90,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <Animated.View
          style={[
            styles.modalCard,
            {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
          ]}>
          <View style={styles.modalIconWrap}>
            <Text style={styles.modalIcon}>🚀</Text>
          </View>

          <View style={styles.modalBadge}>
            <Text style={styles.modalBadgeText}>COMING SOON</Text>
          </View>

          <Text style={styles.modalTitle}>Parent Portal</Text>
          <Text style={styles.modalDesc}>
            We're building something great for parents. Stay tuned — this
            feature will be available very soon!
          </Text>

          <TouchableOpacity style={styles.modalBtn} onPress={onClose}>
            <Text style={styles.modalBtnText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const Role = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRoleSelection = role => {
    setSelectedRole(role);
    if (role === 'parent') {
      navigation.navigate('StudentLogin', {role});
    } else if (role === 'teacher') {
      navigation.navigate('TeacherLogin', {role});
    } else if (role === 'student') {
      navigation.navigate('StudentLogin', {role});
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header Section with Top Dynamic Inset */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            paddingTop: insets.top + 20,
            opacity: headerOpacity,
            transform: [{translateY: headerSlide}],
          },
        ]}>
        <Text style={styles.pageLabel}>PORTAL ACCESS</Text>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to sign in to continue
        </Text>
      </Animated.View>

      {/* Role cards */}
      <View style={styles.cardsSection}>
        {ROLES.map((role, index) => (
          <RoleCard
            key={role.id}
            role={role}
            isSelected={selectedRole === role.id}
            onPress={handleRoleSelection}
            animDelay={index * 100}
          />
        ))}
      </View>

      {/* Footer Section with Bottom Dynamic Inset */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + 20}]}>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://pjsofttech.com')}>
          <Text style={styles.footerText}>
            Having trouble?{' '}
            <Text style={styles.footerLink}>Contact Support</Text>
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerCopyright}>© All Rights Reserved</Text>
      </View>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={showComingSoon}
        onClose={() => {
          setShowComingSoon(false);
          setSelectedRole(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  headerSection: {
    backgroundColor: '#6495ED',
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  pageLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Poppins-Regular',
    lineHeight: 19,
  },
  cardsSection: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 14,
  },
  cardWrapper: {
    shadowColor: '#1A2332',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingRight: 16,
  },
  accentStripe: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  roleSubtitle: {
    fontSize: 12,
    color: '#6B7A8D',
    fontFamily: 'Poppins-Regular',
    lineHeight: 17,
  },
  chevronContainer: {
    marginLeft: 6,
  },
  chevron: {
    fontSize: 26,
    fontFamily: 'Poppins-Regular',
    lineHeight: 28,
    marginTop: -2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    backgroundColor: '#6495ED',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  footerText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  footerLink: {
    color: '#000080',
    fontFamily: 'DMSans-Bold',
    textDecorationLine: 'underline',
  },
  footerCopyright: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 50, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#1A2332',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  modalIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#F4EDF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalBadge: {
    backgroundColor: '#F4EDF9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B3FA0',
    letterSpacing: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'DMSans-Bold',
    color: '#1A2332',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  modalDesc: {
    fontSize: 13,
    color: '#6B7A8D',
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalBtn: {
    backgroundColor: '#6495ED',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    letterSpacing: 0.3,
  },
});

export default Role;
