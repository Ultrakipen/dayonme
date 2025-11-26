/* eslint-env jest */
// src/__mocks__/react-native.js
export const Alert = {
    alert: jest.fn()
  };
  
  export const View = jest.fn().mockImplementation(({children, ...props}) => children);
  export const Text = jest.fn().mockImplementation(({children, ...props}) => children);
  export const TouchableOpacity = jest.fn().mockImplementation(({children, ...props}) => children);
  export const Image = jest.fn().mockImplementation(({source, ...props}) => null);
  export const ScrollView = jest.fn().mockImplementation(({children, ...props}) => children);
  export const TextInput = jest.fn().mockImplementation(({...props}) => null);
  
  export default {
    Alert,
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput
  };