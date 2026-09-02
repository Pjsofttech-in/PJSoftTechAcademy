import React from 'react';
import {StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native';
import ParentHeader from '../../components/ParentComponent/ParentHeader';
import ParentFooter from '../../components/ParentComponent/ParentFooter';

const Result = () => {
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
          <Text style={styles.title}>Result</Text>

          {/* Add your result content here */}
          <View style={styles.resultContainer}>
            <Text style={styles.subtitle}>Student Academic Results</Text>

            {/* Example content - replace with your actual result data */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Latest Exam Results</Text>
              <Text style={styles.cardContent}>Mathematics: 85/100</Text>
              <Text style={styles.cardContent}>English: 92/100</Text>
              <Text style={styles.cardContent}>Science: 88/100</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Overall Performance</Text>
              <Text style={styles.cardContent}>Overall Grade: A</Text>
              <Text style={styles.cardContent}>Percentage: 88.3%</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Previous Term</Text>
              <Text style={styles.cardContent}>Grade: B+</Text>
              <Text style={styles.cardContent}>Percentage: 82.5%</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Class Rank</Text>
              <Text style={styles.cardContent}>Position: 5th out of 45</Text>
              <Text style={styles.cardContent}>Improvement: +3 positions</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <ParentFooter />
    </SafeAreaView>
  );
};

export default Result;

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
  resultContainer: {
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
    marginBottom: 4,
  },
});
