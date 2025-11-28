/**
 * @format
 */

import { AppRegistry, InteractionManager, LogBox } from 'react-native';

// 개발 환경에서 불필요한 에러 로그 숨김
LogBox.ignoreLogs([
  'ErrorReporting',
  '🚨 [ErrorReporting]',
  'Non-serializable values were found',
  'VirtualizedLists should never be nested',
  'Malformed calls from JS',
  'field sizes are different',
  'Exception in HostFunction',
]);
import React, { Component } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { name as appName } from './app.json';

// React Native 0.80 호환성: 동적 import로 앱 로드
// Dimensions.get()은 네이티브 브릿지가 완전히 준비된 후에만 안전

class AppLoader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      AppComponent: null,
      error: null
    };
  }

  componentDidMount() {
    // InteractionManager로 네이티브 브릿지 준비 대기
    InteractionManager.runAfterInteractions(async () => {
      try {
        // 약간의 지연을 추가하여 런타임이 완전히 준비되도록 함
        await new Promise(resolve => setTimeout(resolve, 50));

        // App 컴포넌트 동적 import
        const AppModule = await import('./App');
        const App = AppModule.default;

        this.setState({ AppComponent: App });
      } catch (error) {
        console.error('앱 로딩 실패:', error);
        this.setState({ error });
      }
    });
  }

  render() {
    const { AppComponent, error } = this.state;

    if (error) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#405DE6" />
        </View>
      );
    }

    if (!AppComponent) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#405DE6" />
        </View>
      );
    }

    return <AppComponent />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  }
});

AppRegistry.registerComponent(appName, () => AppLoader);
