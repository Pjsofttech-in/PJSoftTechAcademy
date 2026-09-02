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
import LinearGradient from 'react-native-linear-gradient';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Feather } from '@react-native-vector-icons/feather';
import StudentMenu from '../StudentComponent/StudentMenu';
import companyLogo from '../../assets/companyLogo.jpg';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../auth/AuthContext';
import ParentMenu from './ParentMenu';

const ParentHeader = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const {logout} = useAuth();

  const toggleModal = () => setModalVisible(!modalVisible);

  const handleProfilePress = () => {
    setModalVisible(false);
    navigation.navigate('StudentProfile'); // ✅ Student-specific screen
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
    <LinearGradient colors={['#053596ff', '#7cacf4ff']} style={styles.header}>
      <View style={styles.headerContent}>
        {/* Left: Menu */}
        <View style={styles.sideContainer}>
          <ParentMenu />
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
          <TouchableOpacity onPress={toggleModal}>
            <MaterialIcons name="account-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Popup */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={toggleModal}>
        <Pressable style={styles.modalOverlay} onPress={toggleModal}>
          <View style={styles.popup}>
            <TouchableOpacity
              style={styles.option}
              onPress={handleProfilePress}>
              <Feather name="user" size={20} style={styles.optionIcon} />
              <Text style={styles.optionText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleLogout}>
              <Feather name="log-out" size={20} style={styles.optionIcon} />
              <Text style={styles.optionText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
};

export default ParentHeader;

const styles = StyleSheet.create({
  header: {
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    zIndex: 10,
  },
  headerContent: {
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
    width: 60,
    height: 38,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  popup: {
    backgroundColor: 'rgba(239, 246, 255, 1)',
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 160,
    maxWidth: 250,
    alignSelf: 'flex-end',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  optionIcon: {
    marginRight: 10,
    color: 'rgba(30, 64, 186, 0.92)',
  },
  optionText: {
    fontSize: 13,
    color: 'rgba(30, 64, 186, 0.92)',
    flex: 1,
    fontWeight: '400',
  },
});
