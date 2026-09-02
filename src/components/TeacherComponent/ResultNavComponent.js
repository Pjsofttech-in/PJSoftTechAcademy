import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';

const ResultNavComponent = ({tabs = [], activeTab, onTabChange}) => {
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const buttonRefs = useRef({});
  const [btnWidth, setBtnWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [autoScrollDone, setAutoScrollDone] = useState(false);

  /* ── Layout ─────────────────────────────────────────────── */

  const onContainerLayout = e => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    // 3 equal pills with 4px padding on each side + 8px gaps between
    setBtnWidth((w - 8) / 3);
  };

  const onButtonLayout = (id, e) => {
    const {x, width} = e.nativeEvent.layout;
    buttonRefs.current[id] = {x, width};
    if (id === activeTab) indicatorX.setValue(x);
  };

  /* ── Indicator slide on tab change ──────────────────────── */

  useEffect(() => {
    const ref = buttonRefs.current[activeTab];
    if (!ref) return;
    Animated.spring(indicatorX, {
      toValue: ref.x,
      stiffness: 200,
      damping: 24,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  /* ── Auto-scroll hint (only when tabs > 3) ──────────────── */

  useEffect(() => {
    if (tabs.length <= 3 || btnWidth === 0 || autoScrollDone) return;

    const totalW = btnWidth * tabs.length + (tabs.length - 1) * 8;
    const maxScroll = Math.max(0, totalW - (containerWidth - 8));
    if (maxScroll <= 0) {
      setAutoScrollDone(true);
      return;
    }

    const listenerId = scrollAnim.addListener(({value}) => {
      scrollViewRef.current?.scrollTo({x: value, animated: false});
    });

    const anim = Animated.sequence([
      Animated.timing(scrollAnim, {
        toValue: maxScroll,
        duration: 1400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(300),
      Animated.timing(scrollAnim, {
        toValue: 0,
        duration: 1400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    const timer = setTimeout(() => {
      anim.start(() => {
        scrollAnim.removeListener(listenerId);
        setAutoScrollDone(true);
      });
    }, 800);

    return () => {
      clearTimeout(timer);
      scrollAnim.removeListener(listenerId);
      anim.stop();
    };
  }, [btnWidth, containerWidth, autoScrollDone]);

  /* ── Stop auto-scroll on user touch ─────────────────────── */

  const stopAutoScroll = () => {
    scrollAnim.stopAnimation();
    scrollAnim.removeAllListeners();
    setAutoScrollDone(true);
  };

  /* ── Smooth programmatic scroll to keep active btn centred ─ */

  const scrollToButton = id => {
    const ref = buttonRefs.current[id];
    if (!ref) return;
    const target = ref.x + ref.width / 2 - containerWidth / 2;

    stopAutoScroll();

    let last = null;
    const lid = scrollAnim.addListener(({value}) => {
      if (value !== last) {
        scrollViewRef.current?.scrollTo({x: value, animated: false});
        last = value;
      }
    });

    Animated.timing(scrollAnim, {
      toValue: Math.max(0, target),
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => scrollAnim.removeListener(lid));
  };

  const handlePress = id => {
    scrollToButton(id);
    onTabChange(id);
  };

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <View style={styles.wrapper}>
      <View style={styles.track} onLayout={onContainerLayout}>
        {/* Sliding pill background */}
        {btnWidth > 0 && (
          <Animated.View
            style={[
              styles.activePill,
              {
                width: btnWidth,
                transform: [
                  {translateX: Animated.subtract(indicatorX, scrollX)},
                ],
              },
            ]}
          />
        )}

        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: scrollX}}}],
            {useNativeDriver: true},
          )}
          onScrollBeginDrag={stopAutoScroll}>
          {tabs.map(tab => {
            const active = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.btn, {width: btnWidth}]}
                onPress={() => handlePress(tab.id)}
                onLayout={e => onButtonLayout(tab.id, e)}
                activeOpacity={0.75}>
                <Text
                  style={[styles.label, active && styles.labelActive]}
                  numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>
      </View>

      {/* Bottom accent line */}
      <View style={styles.accentBar} />
    </View>
  );
};

/* ── Styles ────────────────────────────────────────────────── */

const BLUE = '#6366f1'; // matches TeacherHeader / activeTab in ResultContainer
const BLUE_LIGHT = 'rgba(99,102,241,0.08)';
const PILL_RADIUS = 50;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 1,
    paddingTop: 8,
    paddingBottom: 0,
    // subtle card shadow
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  track: {
    backgroundColor: '#f9f9f9',
    borderRadius: PILL_RADIUS,
    padding: 2,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#212123',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: BLUE,
    borderRadius: PILL_RADIUS,
    zIndex: 0,
    // glow
    shadowColor: BLUE,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollContent: {
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: PILL_RADIUS,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    color: '#515d72',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#ffffff',
    fontFamily: 'Poppins-SemiBold',
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: BLUE,
    marginHorizontal: 8,
    marginBottom: 0,
    opacity: 0.15,
  },
});

export default ResultNavComponent;
