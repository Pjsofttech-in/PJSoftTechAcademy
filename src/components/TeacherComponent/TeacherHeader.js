import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Feather } from '@react-native-vector-icons/feather';
import TeacherMenu from './TeacherMenu';
import companyLogo from '../../assets/companyLogo.jpg';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../auth/AuthContext';

const HEADER_HEIGHT = 60;

const TeacherHeader = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const {logout} = useAuth();
  const insets = useSafeAreaInsets();

  const toggleModal = () => setModalVisible(!modalVisible);

  const handleProfilePress = () => {
    setModalVisible(false);
    navigation.navigate('TeacherProfile');
  };

  const handleLogout = async () => {
    setModalVisible(false);
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{name: 'Role'}],
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View style={[styles.header, {paddingTop: insets.top}]}>
      {/* Bottom border accent */}
      <View style={styles.bottomAccent} />

      <View style={styles.headerContent}>
        {/* Left: Menu */}
        <View style={styles.sideContainer}>
          <TeacherMenu />
        </View>

        {/* Center: Logo */}
        <View style={styles.centerContainer}>
          <Image
            source={companyLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Right: Profile Icon */}
        <View style={styles.sideContainer}>
          <TouchableOpacity
            onPress={toggleModal}
            style={styles.profileBtn}
            activeOpacity={0.7}>
            <MaterialIcons name="account-circle" size={26} color="#6a6a6a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Popup Menu */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={toggleModal}>
        <Pressable
          style={[
            styles.modalOverlay,
            {paddingTop: insets.top + HEADER_HEIGHT + 4},
          ]}
          onPress={toggleModal}>
          <View style={styles.popup}>
            {/* Popup header */}
            <View style={styles.popupHeader}>
              <View style={styles.logoMark}>
                <Text style={styles.logoLetter}>T</Text>
              </View>
              <Text style={styles.popupTitle}>My Account</Text>
            </View>
            <View style={styles.popupDivider} />

            <TouchableOpacity
              style={styles.option}
              onPress={handleProfilePress}
              activeOpacity={0.7}>
              <View style={styles.optionIconWrapper}>
                <Feather name="user" size={14} color="#6366f1" />
              </View>
              <Text style={styles.optionText}>My Profile</Text>
              <Feather name="chevron-right" size={14} color="#B0BCCA" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, styles.optionLast]}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <View
                style={[styles.optionIconWrapper, styles.logoutIconWrapper]}>
                <Feather name="log-out" size={14} color="#D93025" />
              </View>
              <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
              <Feather name="chevron-right" size={14} color="#B0BCCA" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default TeacherHeader;

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerContent: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 36,
  },
  profileBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 16,
    backgroundColor: 'rgba(26, 35, 50, 0.18)',
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 190,
    maxWidth: 230,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A2332',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F7F9FC',
  },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  popupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3D4F62',
    letterSpacing: 0.3,
  },
  popupDivider: {
    height: 1,
    backgroundColor: '#f4f4ff',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4ff',
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#f4f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoutIconWrapper: {
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 12,
    color: '#6366f1',
    flex: 1,
    fontWeight: '500',
  },
  logoutText: {
    color: '#D93025',
  },
});
