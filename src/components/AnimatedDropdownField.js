import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  Animated,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AnimatedDropdownField = ({
  label,
  options = [],
  selected,
  onSelect,
  placeholder = 'Select',
  showAllOption = true,
}) => {
  const [labelAnim] = useState(new Animated.Value(selected ? 1 : 0));
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({x: 0, y: 0, width: 0});
  const [dropdownHeight] = useState(new Animated.Value(0));
  const [dropdownOpacity] = useState(new Animated.Value(0));
  const ref = useRef(null);

  useEffect(() => {
    if (selected) {
      labelAnim.setValue(1);
    }
  }, [selected]);

  const animateLabel = toValue => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const openDropdown = () => {
    if (!ref.current) return;

    animateLabel(1);
    ref.current.measure((x, y, width, height, pageX, pageY) => {
      const itemHeight = 48;
      const maxItems = 4;

      // Calculate actual items count
      const itemsCount = options.length + (showAllOption ? 1 : 0);
      const calculatedHeight = Math.min(
        itemsCount * itemHeight,
        maxItems * itemHeight,
      );

      setDropdownPos({x: pageX, y: pageY + height + 6, width});
      dropdownHeight.setValue(0);
      dropdownOpacity.setValue(0);
      setIsOpen(true);

      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: calculatedHeight,
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
    if (!selected) animateLabel(0);

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
    ]).start(() => {
      setIsOpen(false);
    });
  };

  const handleSelect = value => {
    onSelect(value);
    animateLabel(1);
    closeDropdown();
  };

  const labelTranslateY = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -8],
  });

  const labelOpacity = labelAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.dropdownWrapper}>
        {/* Floating Label */}
        <Animated.View
          style={[
            styles.floatingLabel,
            {
              transform: [{translateY: labelTranslateY}],
              opacity: labelOpacity,
            },
          ]}>
          <Text style={styles.floatingLabelText}>{label}</Text>
        </Animated.View>

        {/* Dropdown Trigger */}
        <Pressable
          ref={ref}
          style={styles.dropdownButton}
          onPress={openDropdown}>
          <Text style={[styles.selectedValue, !selected && {color: '#9CA3AF'}]}>
            {selected === 'ALL' ? 'All' : selected || label}
          </Text>

          <Icon name="chevron-down" size={16} color="#6B7280" />
        </Pressable>
      </View>

      {/* Dropdown Modal */}
      {isOpen && (
        <Modal transparent visible onRequestClose={closeDropdown}>
          <Pressable style={styles.modalOverlay} onPressOut={closeDropdown}>
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  position: 'absolute',
                  top: dropdownPos.y,
                  left: dropdownPos.x,
                  width: dropdownPos.width,
                  height: dropdownHeight,
                  opacity: dropdownOpacity,
                },
              ]}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}>
                {showAllOption && (
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => handleSelect('ALL')}>
                    <Text style={styles.dropdownItemText}>All</Text>
                  </Pressable>
                )}
                {options.map((item, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.dropdownItem,
                      index === options.length - 1 && styles.lastDropdownItem,
                    ]}
                    onPress={() => handleSelect(item)}>
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {marginBottom: 8},
  dropdownWrapper: {position: 'relative'},
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 0,
    zIndex: 1,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(112, 172, 246, 1)',
    borderRadius: 4,
  },
  floatingLabelText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'DMSans-Medium',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  selectedValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontFamily: 'DMSans-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    maxHeight: 200,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'DMSans-Medium',
  },
});

export default AnimatedDropdownField;
