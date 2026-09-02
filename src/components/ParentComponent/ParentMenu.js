import React, {useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  Easing,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import companyLogo from '../../assets/companyLogo.jpg'; // Adjust path if needed
import {useNavigation} from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const ParentMenu = () => {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const navigation = useNavigation();

  const menuOptions = [
    {
      label: 'Dashboard',
      icon: 'grid',
      iconType: 'Feather',
      screen: 'SDashboard',
    },
    {
      label: 'Attendance',
      icon: 'calendar',
      iconType: 'Feather',
      screen: 'Attendance',
    },
    {
      label: 'Result',
      icon: 'bar-chart-2',
      iconType: 'Feather',
      screen: 'Result',
    },
    {
      label: 'Time Table',
      icon: 'schedule',
      iconType: 'MaterialIcons',
      screen: 'TimeTable',
    },
  ];

  const animateMenu = show => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (show) {
      setVisible(true);
      opacityAnim.setValue(0);
      slideAnim.setValue(-screenWidth);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start(() => setIsAnimating(false));
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -screenWidth,
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        setIsAnimating(false);
      });
    }
  };

  const openMenu = () => {
    if (!visible && !isAnimating) {
      animateMenu(true);
    }
  };

  const closeMenu = () => {
    animateMenu(false);
  };

  const renderMenuItem = (option, index) => {
    const IconComponent =
      option.iconType === 'MaterialIcons' ? MaterialIcons : Feather;

    return (
      <TouchableOpacity
        key={index}
        style={styles.option}
        onPress={() => {
          closeMenu(); // Close the menu first
          if (option.screen) {
            navigation.navigate(option.screen); // Navigate to the screen
          }
        }}>
        <IconComponent
          name={option.icon}
          size={20}
          color="#rgba(30, 64, 186, 0.92)"
          style={styles.optionIcon}
        />
        <Text style={styles.optionText}>{option.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Pressable
        onPress={openMenu}
        style={({pressed}) => [
          styles.menuButton,
          pressed && styles.menuButtonPressed,
        ]}>
        <Feather name="menu" size={26} color="#fff" />
      </Pressable>

      {visible && (
        <Modal transparent animationType="none" visible={visible}>
          <Animated.View style={[styles.container, {opacity: opacityAnim}]}>
            <Pressable style={styles.overlay} onPress={closeMenu} />
            <Animated.View
              style={[
                styles.menuContainer,
                {transform: [{translateX: slideAnim}]},
              ]}>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                  <Image
                    source={companyLogo}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <TouchableOpacity onPress={closeMenu}>
                    <Feather name="x" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.menuOptions}
                  showsVerticalScrollIndicator={false}>
                  {menuOptions.map(renderMenuItem)}
                </ScrollView>
              </SafeAreaView>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
};

export default ParentMenu;

const styles = StyleSheet.create({
  container: {flex: 1, flexDirection: 'row'},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'},
  menuContainer: {
    width: screenWidth * 0.65,
    maxWidth: 300,
    backgroundColor: 'rgb(244, 239, 255)',
    height: '100%',
    position: 'absolute',
    left: 0,
    elevation: 10,
  },
  safeArea: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#053596ff',
    backgroundColor: '#053596ff',
  },
  logo: {
    width: 60,
    height: 38,
  },
  menuOptions: {flex: 1},
  option: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 13,
    color: 'rgba(30, 64, 186, 0.92)',
    flex: 1,
    fontWeight: '400',
  },
  menuButton: {
    padding: 10,
  },
  menuButtonPressed: {
    opacity: 0.7,
  },
});
