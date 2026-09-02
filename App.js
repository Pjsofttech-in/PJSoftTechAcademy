// App.js - Main app component with AuthProvider
import 'react-native-gesture-handler';
import { decode,encode } from 'base-64';

global.atob = global.atob || decode;
global.btoa = global.btoa || encode;

import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/auth/AuthContext';
import AuthNavigator from './src/auth/AuthNavigator';

const App = () => {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthNavigator />
    </AuthProvider>
  );
};

export default App;