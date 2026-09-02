import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Keyboard,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudentFooter = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );
  const [studentData, setStudentData] = useState(null);

  const currentRoute = route.name;

  useEffect(() => {
    AsyncStorage.getItem('studentData')
      .then(stored => {
        if (stored) setStudentData(JSON.parse(stored));
      })
      .catch(err =>
        console.warn('StudentFooter: failed to load studentData', err),
      );
  }, []);

  useEffect(() => {
    const onChange = ({window}) => setScreenWidth(window.width);

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    const dimensionListener = Dimensions.addEventListener('change', onChange);

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      dimensionListener?.remove?.();
    };
  }, []);

  if (isKeyboardVisible) return null;

  const tabs = [
    {
      name: 'SDashboard',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
      onPress: () => navigation.navigate('SDashboard', {studentData}),
    },
    {
      name: 'Attendance',
      label: 'Attendance',
      icon: 'calendar-outline',
      activeIcon: 'calendar',
      onPress: () => navigation.navigate('Attendance', {studentData}),
    },
    {
      name: 'Result',
      label: 'Result',
      icon: 'bar-chart-outline',
      activeIcon: 'bar-chart',
      onPress: () => navigation.navigate('Result', {studentData}),
    },
    {
      name: 'TimeTable',
      label: 'Time Table',
      icon: 'time-outline',
      activeIcon: 'time',
      onPress: () => navigation.navigate('TimeTable', {studentData}),
    },
  ];

  const renderTab = (tab, index) => {
    const isActive = currentRoute === tab.name;

    return (
      <TouchableOpacity
        key={index}
        style={styles.tabButton}
        onPress={tab.onPress}
        activeOpacity={0.7}>
        <Ionicons
          name={isActive ? tab.activeIcon : tab.icon}
          size={20}
          color={isActive ? '#6366f1' : '#6B7A8D'}
        />
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {width: screenWidth, paddingBottom: insets.bottom},
      ]}>
      <View style={styles.topBorder} />
      <View style={styles.footer}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab, index) => renderTab(tab, index))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A2332',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  topBorder: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  footer: {
    height: 62,
    paddingHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabLabel: {
    color: '#6B7A8D',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    color: '#6366f1',
    fontWeight: '700',
  },
});

export default StudentFooter;
