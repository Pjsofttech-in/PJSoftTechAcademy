import React from 'react';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';

import TDashboard from './TDashboard';
import Classroom from './Classroom';
import DetailedResult from './Results/DetailedResult';
import Assignment from './Assignment';
import Attendance from './Attendance';
import AttendanceFilter from './AttendanceFilter';
import TeacherProfile from './profile/TeacherProfile';
import ResultContainer from './Results/ResultContainer';
import Result from './Results/Result';
import AssignMarksScreen from './AssignMarksScreen';
import StudentMarksheet from './Results/StudentMarksheet';
import MarkAttendanceScreen from './MarkAttendanceScreen';
import SubmitAssignment from './SubmitAssignment';
import AssignmentSubmission from './AssignmentSubmission';
import StudentList from './StudentList';
import Timetable from './Timetable';

const Stack = createStackNavigator();

const TeacherNavigator = () => {
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
      <Stack.Screen name="TDashboard" component={TDashboard} />
      <Stack.Screen name="Classroom" component={Classroom} />
      <Stack.Screen name="Assignment" component={Assignment} />
      <Stack.Screen name="SubmitAssignment" component={SubmitAssignment} />
      <Stack.Screen name="Attendance" component={Attendance} />
      <Stack.Screen name="AttendanceFilter" component={AttendanceFilter} />
      <Stack.Screen name="TeacherProfile" component={TeacherProfile} />
      <Stack.Screen name="Results" component={ResultContainer} />
      <Stack.Screen name="DetailedResult" component={DetailedResult} />
      <Stack.Screen name="Result" component={Result} />
      <Stack.Screen name="AssignMarks" component={AssignMarksScreen} />
      <Stack.Screen name="StudentMarksheet" component={StudentMarksheet} />
      <Stack.Screen
        name="AssignmentSubmission"
        component={AssignmentSubmission}
      />
      <Stack.Screen name="Student" component={StudentList} />
      <Stack.Screen name="Timetable" component={Timetable} />
      <Stack.Screen
        name="MarkAttendanceScreen"
        component={MarkAttendanceScreen}
      />
    </Stack.Navigator>
  );
};

export default TeacherNavigator;
