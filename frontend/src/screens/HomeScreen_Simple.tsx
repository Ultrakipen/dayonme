// Temporary Simple HomeScreen for debugging
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, color: '#000000', fontWeight: 'bold' }}>
          Simple HomeScreen - Testing
        </Text>
        <Text style={{ fontSize: 16, color: '#666666', marginTop: 10 }}>
          If you see this, the app is loading correctly.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
