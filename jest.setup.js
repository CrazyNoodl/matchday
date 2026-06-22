// Minimal Jest setup for React Native component tests.
'use strict';

// Required by React Native internals before any RN module is loaded.
global.__DEV__ = true;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
