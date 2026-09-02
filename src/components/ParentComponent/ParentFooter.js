import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  Platform,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const ParentFooter = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );

  useEffect(() => {
    const onChange = ({window}) => {
      setScreenWidth(window.width);
    };

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

  return (
    <SafeAreaView style={[styles.safeContainer, {width: screenWidth}]}>
      <LinearGradient
        colors={['#053596ff', '#7cacf4ff']}
        style={styles.background}
        start={{x: 0, y: 1}}
        end={{x: 0, y: 0}}>
        <TouchableOpacity style={styles.tabButton} activeOpacity={0.7}>
          <View style={styles.buttonContent}>
            <Ionicons name="home-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Home</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} activeOpacity={0.7}>
          <View style={styles.buttonContent}>
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Attendance</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} activeOpacity={0.7}>
          <View style={styles.buttonContent}>
            <Ionicons name="bar-chart-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Result</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} activeOpacity={0.7}>
          <View style={styles.buttonContent}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Time Table</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default ParentFooter;

const styles = StyleSheet.create({
  safeContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#F8F9FA',
    ...Platform.select({
      ios: {paddingBottom: 0},
      android: {paddingBottom: 0},
    }),
  },
  background: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 10,
    paddingHorizontal: 20,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
