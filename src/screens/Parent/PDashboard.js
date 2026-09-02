import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParentHeader from '../../components/ParentComponent/ParentHeader';
import ParentFooter from '../../components/ParentComponent/ParentFooter';

const PDashboard = ({route}) => {
  const [parentData, setParentData] = useState(
    route.params?.parentData || null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadParentData = async () => {
      if (!parentData) {
        try {
          const storedData = await AsyncStorage.getItem('parentData');
          if (storedData) {
            setParentData(JSON.parse(storedData));
          }
        } catch (error) {
          console.error('Error loading parent data:', error);
        }
      }
      setIsLoading(false);
    };

    loadParentData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ParentHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Parent Dashboard</Text>
        {parentData && (
          <View style={styles.infoContainer}>
            <Text style={styles.welcomeText}>Welcome, {parentData.name}!</Text>
            <Text style={styles.emailText}>Email: {parentData.email}</Text>
            <Text style={styles.childrenTitle}>Your Children:</Text>
            {parentData.children?.map((child, index) => (
              <View key={child.id} style={styles.childCard}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childClass}>Class: {child.class}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <ParentFooter />
    </SafeAreaView>
  );
};

export default PDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  childrenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  childCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  childClass: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
