import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PDashboard from './PDashboard';
import Attendance from './Attendance';
import Result from './Result';

const Stack = createStackNavigator();

const ParentNavigator = ({route}) => {
  const {parentData} = route.params || {};

  console.log('🏗️ ParentNavigator received params:', route.params);
  console.log('👨‍👩‍👧‍👦 ParentNavigator parentData:', parentData);

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="PDashboard"
        component={PDashboard}
        initialParams={{parentData}}
      />
      <Stack.Screen
        name="Attendance"
        component={Attendance}
        initialParams={{parentData}}
      />
      <Stack.Screen
        name="Result"
        component={Result}
        initialParams={{parentData}}
      />
    </Stack.Navigator>
  );
};

export default ParentNavigator;
