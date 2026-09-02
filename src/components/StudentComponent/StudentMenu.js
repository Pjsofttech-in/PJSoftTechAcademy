import React, {useRef, useState, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useNavigationState} from '@react-navigation/native';
import {useAuth} from '../../auth/AuthContext';
import companyLogo from '../../assets/companyLogo.jpg';

// ─────────────────────────────────────────────
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 290);

// Spring config — same as TeacherMenu
const SPRING_OPEN = {tension: 180, friction: 22, useNativeDriver: true};
const SPRING_CLOSE = {tension: 240, friction: 26, useNativeDriver: true};
// ─────────────────────────────────────────────

const StudentMenu = () => {
  const navigation = useNavigation();
  const {logout} = useAuth();
  const [visible, setVisible] = useState(false);

  // translateX:  0 = fully open,  -MENU_WIDTH = fully closed
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  // overlay opacity derived from translateX via interpolation
  const overlayOpacity = translateX.interpolate({
    inputRange: [-MENU_WIDTH, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const currentRouteName = useNavigationState(
    state => state.routes[state.index].name,
  );

  const menuOptions = [
    {
      label: 'Dashboard',
      value: 'SDashboard',
      icon: 'grid',
      iconType: 'Feather',
      description: 'Overview & summary',
    },
    {
      label: 'Attendance',
      value: 'Attendance',
      icon: 'calendar',
      iconType: 'Feather',
      description: 'Track attendance',
    },
    {
      label: 'Assignment',
      value: 'Assignment',
      icon: 'file-text',
      iconType: 'Feather',
      description: 'Tasks & submissions',
    },
    {
      label: 'Result',
      value: 'Result',
      icon: 'bar-chart-2',
      iconType: 'Feather',
      description: 'Grades & scores',
    },
    {
      label: 'Time Table',
      value: 'TimeTable',
      icon: 'schedule',
      iconType: 'MaterialIcons',
      description: 'Class schedule',
    },
  ];

  // ── Spring open ──
  const springOpen = useCallback(() => {
    setVisible(true);
    translateX.setValue(-MENU_WIDTH);
    Animated.spring(translateX, {
      toValue: 0,
      ...SPRING_OPEN,
    }).start();
  }, [translateX]);

  // ── Spring close ──
  const springClose = useCallback(
    onDone => {
      Animated.spring(translateX, {
        toValue: -MENU_WIDTH,
        ...SPRING_CLOSE,
      }).start(({finished}) => {
        if (finished) {
          setVisible(false);
          translateX.setValue(-MENU_WIDTH);
          onDone && onDone();
        }
      });
    },
    [translateX],
  );

  // ── Navigation / logout ──
  const handleOptionPress = async screenName => {
    if (screenName === 'Logout') {
      springClose(async () => {
        try {
          await logout();
          navigation.getParent?.()?.reset?.({
            index: 0,
            routes: [{name: 'Role'}],
          });
        } catch (error) {
          console.error('Logout failed:', error);
        }
      });
      return;
    }

    springClose(() => {
      try {
        navigation.navigate(screenName);
      } catch (error) {
        console.warn('Menu navigation failed:', error);
      }
    });
  };

  // ── Render a single menu item ──
  const renderMenuItem = (option, index) => {
    const isActive = currentRouteName === option.value;
    const IconComponent =
      option.iconType === 'MaterialIcons' ? MaterialIcons : Feather;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.option, isActive && styles.activeOption]}
        onPress={() => handleOptionPress(option.value)}
        activeOpacity={0.7}>
        {/* Icon badge */}
        <View
          style={[styles.optionIconBadge, isActive && styles.activeIconBadge]}>
          <IconComponent
            name={option.icon}
            size={16}
            color={isActive ? '#6366f1' : '#6B7A8D'}
          />
        </View>

        {/* Labels */}
        <View style={styles.optionLabels}>
          <Text
            style={[styles.optionText, isActive && styles.activeOptionText]}>
            {option.label}
          </Text>
          {option.description ? (
            <Text style={styles.optionDescription}>{option.description}</Text>
          ) : null}
        </View>

        {/* Active chevron */}
        {isActive && (
          <View style={styles.activeChevronBadge}>
            <Feather name="chevron-right" size={12} color="#6366f1" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── JSX ──
  return (
    <View>
      {/* Hamburger trigger */}
      <Pressable
        onPress={springOpen}
        style={({pressed}) => [
          styles.menuButton,
          pressed && styles.menuButtonPressed,
        ]}>
        <Feather name="menu" size={22} color="#5b5b5b" />
      </Pressable>

      {/* Drawer modal */}
      {visible && (
        <Modal
          transparent
          animationType="none"
          visible={visible}
          onRequestClose={() => springClose()}
          statusBarTranslucent>
          <View style={styles.root}>
            {/* Dimmed overlay */}
            <Animated.View
              style={[styles.overlay, {opacity: overlayOpacity}]}
              pointerEvents="none"
            />

            {/* Tap-outside to close */}
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => springClose()}
            />

            {/* Drawer */}
            <Animated.View
              style={[styles.menuContainer, {transform: [{translateX}]}]}>
              <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.drawerHeader}>
                  <Image
                    source={companyLogo}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    onPress={() => springClose()}
                    style={styles.closeBtn}
                    activeOpacity={0.7}>
                    <View style={styles.closeBtnInner}>
                      <Feather name="x" size={16} color="#6B7A8D" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* App name row */}
                <View style={styles.appNameRow}>
                  <View style={styles.logoMark}>
                    <Text style={styles.logoLetter}>S</Text>
                  </View>
                  <View>
                    <Text style={styles.appName}>PJSoftTech</Text>
                    <Text style={styles.appSubtitle}>Student Portal</Text>
                  </View>
                </View>

                <View style={styles.sectionDivider} />

                {/* Section label */}
                <Text style={styles.sectionLabel}>NAVIGATION</Text>

                {/* Menu items */}
                <ScrollView
                  style={styles.menuOptions}
                  showsVerticalScrollIndicator={false}
                  bounces={false}>
                  {menuOptions.map(renderMenuItem)}
                </ScrollView>

                {/* Logout */}
                <View style={styles.logoutSection}>
                  <View style={styles.sectionDivider} />
                  <TouchableOpacity
                    style={styles.logoutOption}
                    onPress={() => handleOptionPress('Logout')}
                    activeOpacity={0.7}>
                    <View style={styles.logoutIconBadge}>
                      <Feather name="log-out" size={16} color="#D93025" />
                    </View>
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 35, 50, 0.45)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#6366f1',
    elevation: 24,
    shadowColor: '#1A2332',
    shadowOffset: {width: 4, height: 0},
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logo: {
    width: 72,
    height: 38,
  },
  closeBtn: {
    padding: 2,
  },
  closeBtnInner: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#D8E3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // App name row
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -0.2,
  },
  appSubtitle: {
    fontSize: 10,
    color: '#6B7A8D',
    fontFamily: 'Poppins-Medium',
    marginTop: 1,
  },

  // Divider / section label
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'DMSans-Medium',
    color: '#6366f1',
    letterSpacing: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },

  // Menu items
  menuOptions: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  activeOption: {
    backgroundColor: '#f0f0ff',
    borderWidth: 1,
    borderColor: '#b7b8ff',
  },
  optionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#D8E3EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeIconBadge: {
    backgroundColor: '#FFFFFF',
    borderColor: '#b7b8ff',
  },
  optionLabels: {
    flex: 1,
  },
  optionText: {
    fontSize: 12,
    color: '#3D4F62',
    fontFamily: 'DMSans-Medium',
  },
  activeOptionText: {
    color: '#6366f1',
    fontFamily: 'DMSans-Bold',
  },
  optionDescription: {
    fontSize: 10,
    color: '#9AAABB',
    marginTop: 1,
    fontFamily: 'DMSans-Medium',
  },
  activeChevronBadge: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#b7b8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logout
  logoutSection: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  logoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  logoutIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 12,
    color: '#D93025',
    fontFamily: 'DMSans-Medium',
  },

  // Hamburger button
  menuButton: {
    padding: 4,
  },
  menuButtonPressed: {
    opacity: 0.6,
  },
});

export default StudentMenu;
