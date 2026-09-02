import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from './AuthContext';

import Role from '../screens/Role';
import TeacherLogin from '../authenticationStack/TeacherLogin';
import TeacherNavigator from '../screens/Teacher/TeacherNavigator';
// import LoadingScreen from '../components/LoadingScreen';
import StudentNavigator from '../screens/Student/StudentNavigator';
import StudentLogin from '../authenticationStack/StudentLogin';
import ParentLogin from '../authenticationStack/ParentLogin';
import ParentNavigator from '../screens/Parent/ParentNavigator';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const {globalLoading} = useAuth();

  if (globalLoading) return <LoadingScreen text="Loading..." />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}>
        <Stack.Screen name="Role" component={Role} />
        <Stack.Screen name="TeacherLogin" component={TeacherLogin} />
        <Stack.Screen name="StudentLogin" component={StudentLogin} />
        <Stack.Screen name="ParentLogin" component={ParentLogin} />
        <Stack.Screen name="TeacherDashboard" component={TeacherNavigator} />
        <Stack.Screen name="StudentNavigator" component={StudentNavigator} />
        <Stack.Screen name="ParentNavigator" component={ParentNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;
