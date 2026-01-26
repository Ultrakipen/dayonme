// react-native-config 타입 선언
declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    API_TIMEOUT?: string;
    ONESIGNAL_APP_ID?: string;
    MAX_IMAGE_SIZE?: string;
    IMAGE_QUALITY?: string;
    KAKAO_REST_API_KEY?: string;
    KAKAO_NATIVE_APP_KEY?: string;
    KAKAO_REDIRECT_URI?: string;
    SENTRY_DSN?: string;
    APP_VERSION?: string;
    BUILD_NUMBER?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
