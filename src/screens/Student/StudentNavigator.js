import React from 'react';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';
import SDashboard from './SDashboard';
import Attendance from './Attendance';
import Result from './Result';
import StudentProfile from './StudentProfile';
import Assignment from './Assignment';
import TimeTable from './TimeTable';

const Stack = createStackNavigator();

const StudentNavigator = ({route}) => {
  const {studentData} = route.params || {};

  // Debug logging
  console.log('🏗️ StudentNavigator received params:', route.params);
  console.log('👤 StudentNavigator studentData:', studentData);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 0,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 0,
            },
          },
        },
      }}>
      <Stack.Screen
        name="SDashboard"
        component={SDashboard}
        initialParams={{studentData}}
      />
      <Stack.Screen
        name="Attendance"
        component={Attendance}
        initialParams={{studentData}}
      />
      <Stack.Screen
        name="Result"
        component={Result}
        initialParams={{studentData}}
      />
      <Stack.Screen
        name="StudentProfile"
        component={StudentProfile}
        initialParams={{studentData}}
      />
      <Stack.Screen
        name="Assignment"
        component={Assignment}
        initialParams={{studentData}}
      />
      <Stack.Screen
        name="TimeTable"
        component={TimeTable}
        initialParams={{studentData}}
      />
    </Stack.Navigator>
  );
};

export default StudentNavigator;
