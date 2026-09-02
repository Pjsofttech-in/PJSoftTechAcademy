import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import TeacherHeader from '../../../components/TeacherComponent/TeacherHeader';
import TeacherFooter from '../../../components/TeacherComponent/TeacherFooter';
import ResultNavComponent from '../../../components/TeacherComponent/ResultNavComponent';
import {useRoute} from '@react-navigation/native';
import PieChartComponent from '../../../components/PieChartComponent';
import Result from './Result';
import DetailedResult from './DetailedResult';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Theme Palette ─────────────────────────────────────────────────────────────
const P = {
  brand: '#6366f1',
  sub: '#64748B',
  bg: '#F8FAFC',
};

// ── Tab Config ────────────────────────────────────────────────────────────────
const TABS = [
  {id: 'Analytics', label: 'Analytics'},
  {id: 'Result', label: 'Result'},
  {id: 'DetailedResult', label: 'Detailed'},
];

/* ── Main Component ──────────────────────────────────────────────────────────── */
const ResultContainer = () => {
  const route = useRoute();
  const initialTab = route.params?.initialTab || 'Analytics';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // ── Hydrate User Data Safely ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const loadUserData = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        const keysToTry = [
          storedRole ? `${storedRole}Data` : null,
          'teacherData',
          'userData',
        ].filter(Boolean);

        for (const key of keysToTry) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (isMounted) {
              setUserData({
                ...parsed,
                role: parsed.role || storedRole || 'teacher',
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('Failed to load user data in ResultContainer:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Render Active Tab Content ────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'Analytics':
        return (
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              <PieChartComponent />
            </View>
          </ScrollView>
        );

      case 'Result':
        return <Result userData={userData} />;

      case 'DetailedResult':
        return <DetailedResult userData={userData} />;

      default:
        return null;
    }
  };

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={P.brand} />
          <Text style={styles.loadingText}>Initializing Workspace…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <TeacherHeader />

      <View style={styles.content}>
        <ResultNavComponent
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {renderContent()}
      </View>

      <TeacherFooter />
    </SafeAreaView>
  );
};

export default ResultContainer;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 24,
  },
  contentContainer: {
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.bg,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: P.sub,
    marginTop: 12,
  },
});
