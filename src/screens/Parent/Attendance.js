import React from 'react';
import {StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native';
import ParentHeader from '../../components/ParentComponent/ParentHeader';
import ParentFooter from '../../components/ParentComponent/ParentFooter';

const Attendance = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ParentHeader />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Attendance</Text>

          {/* Add your attendance content here */}
          <View style={styles.attendanceContainer}>
            <Text style={styles.subtitle}>Student Attendance Records</Text>

            {/* Example content - replace with your actual attendance data */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's Attendance</Text>
              <Text style={styles.cardContent}>Present: 5/5 subjects</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>This Week</Text>
              <Text style={styles.cardContent}>Overall: 95% attendance</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>This Month</Text>
              <Text style={styles.cardContent}>Overall: 92% attendance</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <ParentFooter />
    </SafeAreaView>
  );
};

export default Attendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Extra space at bottom
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  attendanceContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#6B7280',
  },
});
