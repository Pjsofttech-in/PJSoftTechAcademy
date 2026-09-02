import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {fetchExamTypes, fetchPaperTypes} from '../util/Apicall';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {useAuth} from '../auth/AuthContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const ExamPaperTypeSelector = ({
  onExamTypeChange,
  onPaperTypeChange,
  customTextStyle = {},
}) => {
  const {userData} = useAuth();
  const [examTypes, setExamTypes] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [selectedPaperType, setSelectedPaperType] = useState(null);

  const examDropdownRef = useRef(null);
  const paperDropdownRef = useRef(null);
  const [dropdownType, setDropdownType] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
  });
  const [dropdownHeight] = useState(new Animated.Value(0));
  const [dropdownOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!userData?.email || !userData?.role || !userData?.branchCode)
          return;
        const exams = await fetchExamTypes({
          email: userData.email,
          role: userData.role,
          branchCode: userData.branchCode,
        });
        const papers = await fetchPaperTypes({
          email: userData.email,
          role: userData.role,
          branchCode: userData.branchCode,
        });
        setExamTypes(Array.isArray(exams) ? exams : []);
        setPaperTypes(Array.isArray(papers) ? papers : []);
      } catch (error) {
        setExamTypes([]);
        setPaperTypes([]);
      }
    };
    loadData();
  }, [userData]);

  const openDropdown = (type, ref) => {
    const list = type === 'exam' ? examTypes : paperTypes;
    setDropdownType(type);
    if (!ref?.current) return;

    ref.current.measure((x, y, width, height, pageX, pageY) => {
      const itemHeight = 44;
      const maxVisibleItems = 4;
      const totalItems = list.length + 1;
      const calculatedHeight = Math.min(
        totalItems * itemHeight,
        maxVisibleItems * itemHeight,
      );
      const finalHeight = Math.max(calculatedHeight, itemHeight * 2);

      // Check space remaining before the bottom of screen (including system nav bar area)
      const spaceBelow = SCREEN_HEIGHT - (pageY + height);
      let targetY = pageY + height + 6;

      // Flip UPWARD if remaining space is less than finalHeight + safe padding
      if (spaceBelow < finalHeight + 40) {
        targetY = pageY - finalHeight - 6;
      }

      setDropdownPosition({x: pageX, y: targetY, width: width});
      dropdownHeight.setValue(0);
      dropdownOpacity.setValue(0);
      setDropdownVisible(true);

      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: finalHeight,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(dropdownHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => setDropdownVisible(false));
  };

  const handleSelect = value => {
    const isAll = value === 'ALL';
    if (dropdownType === 'exam') {
      if (isAll) {
        setSelectedExamType(null);
        onExamTypeChange?.(null);
      } else {
        setSelectedExamType(value.examType);
        onExamTypeChange?.(value);
      }
    } else {
      if (isAll) {
        setSelectedPaperType(null);
        onPaperTypeChange?.(null);
      } else {
        setSelectedPaperType(value.paperType);
        onPaperTypeChange?.(value);
      }
    }
    closeDropdown();
  };

  const dropdownData = dropdownType === 'exam' ? examTypes : paperTypes;

  const renderPill = (label, value, ref, type) => {
    const isSelected = !!value;
    return (
      <Pressable
        ref={ref}
        style={[styles.pill, isSelected && styles.pillSelected]}
        onPress={() => openDropdown(type, ref)}>
        <Ionicons
          name={type === 'exam' ? 'school-outline' : 'document-text-outline'}
          size={13}
          color={isSelected ? '#fff' : '#5B6B8A'}
          style={{marginRight: 5}}
        />
        <Text
          style={[styles.pillText, isSelected && styles.pillTextSelected]}
          numberOfLines={1}>
          {value || label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={12}
          color={isSelected ? '#fff' : '#5B6B8A'}
          style={{marginLeft: 4}}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.row}>
      {renderPill('Exam Type', selectedExamType, examDropdownRef, 'exam')}
      {renderPill('Paper Type', selectedPaperType, paperDropdownRef, 'paper')}

      {dropdownVisible && (
        <Modal transparent visible onRequestClose={closeDropdown}>
          <Pressable style={styles.modalOverlay} onPress={closeDropdown}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  position: 'absolute',
                  top: dropdownPosition.y,
                  left: dropdownPosition.x,
                  width: dropdownPosition.width,
                  height: dropdownHeight,
                  opacity: dropdownOpacity,
                },
              ]}>
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                style={{flex: 1}}>
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => handleSelect('ALL')}>
                  <Text style={styles.dropdownItemText}>All</Text>
                </Pressable>
                {dropdownData.map((item, index) => {
                  const label =
                    dropdownType === 'exam' ? item.examType : item.paperType;
                  const isSelected =
                    dropdownType === 'exam'
                      ? selectedExamType === item.examType
                      : selectedPaperType === item.paperType;
                  return (
                    <Pressable
                      key={item.id || `${label}-${index}`}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.selectedDropdownItem,
                      ]}
                      onPress={() => handleSelect(item)}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.selectedDropdownItemText,
                        ]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D0DAF0',
  },
  pillSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  pillText: {
    fontSize: 12,
    color: '#5B6B8A',
    fontFamily: 'DMSans-Medium',
    maxWidth: 90,
  },
  pillTextSelected: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E9F2',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 44,
    justifyContent: 'center',
  },
  selectedDropdownItem: {
    backgroundColor: '#EEF4FF',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'DMSans-Medium',
  },
  selectedDropdownItemText: {
    color: 'rgba(112, 172, 246, 1)',
    fontFamily: 'DMSans-Bold',
  },
});

export default ExamPaperTypeSelector;
