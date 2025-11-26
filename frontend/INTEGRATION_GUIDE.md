# PostDetail 개선 기능 통합 가이드

## 📋 개요

이 문서는 PostDetail 화면 개선 기능을 앱에 통합하는 방법을 설명합니다.

## 🚀 통합 단계

### 1단계: Navigation 설정 업데이트

App.tsx 또는 navigation 설정 파일에서 PostDetail 라우트를 PostDetailRouter로 변경합니다.

#### 기존 코드
```typescript
import PostDetailScreen from './src/screens/PostDetail';

<Stack.Screen
  name="PostDetail"
  component={PostDetailScreen}
  options={{ headerShown: false }}
/>
```

#### 변경 후
```typescript
import PostDetailRouter from './src/screens/PostDetail/PostDetailRouter';

<Stack.Screen
  name="PostDetail"
  component={PostDetailRouter}  // ✅ Router로 변경
  options={{ headerShown: false }}
/>
```

### 2단계: 의존성 확인

필요한 패키지가 설치되어 있는지 확인합니다.

```bash
# react-native-fast-image (이미지 최적화)
npm install react-native-fast-image

# 또는 yarn
yarn add react-native-fast-image

# iOS 의존성 설치
cd ios && pod install && cd ..
```

### 3단계: 테스트

#### HomeScreen에서 테스트
```typescript
// HomeScreen에서 게시물 클릭 시
// ✅ 이미 적용됨 (enableSwipe: true)
navigation.navigate('PostDetail', {
  postId: post.post_id,
  postType: 'myday',
  sourceScreen: 'home',
  enableSwipe: true
});
```

#### ComfortScreen에서 테스트
```typescript
// ComfortScreen에서 게시물 클릭 시
// ✅ 이미 적용됨 (enableSwipe: true)
navigation.navigate('PostDetail', {
  postId: post.post_id,
  postType: 'comfort',
  sourceScreen: 'comfort',
  enableSwipe: true
});
```

#### 기존 방식 유지가 필요한 경우
```typescript
// 알림, 프로필 등에서는 기존 방식 사용
navigation.navigate('PostDetail', {
  postId: post.post_id,
  postType: 'comfort',
  enableSwipe: false  // 또는 생략
});
```

## 🎯 동작 방식

### PostDetailRouter 로직

```typescript
const PostDetailRouter = () => {
  const route = useRoute();
  const { enableSwipe } = route.params;

  if (enableSwipe) {
    return <PostDetailSwipeWrapper />;  // 스와이프 기능
  }

  return <PostDetailScreen />;  // 기존 방식
};
```

### 사용자 경험 흐름

```
HomeScreen
  ↓ 게시물 클릭 (enableSwipe: true)
PostDetailRouter
  ↓ enableSwipe 확인
PostDetailSwipeWrapper
  ↓ FlatList 수직 페이징
[게시물 1] ← 현재
[게시물 2] ← 스와이프 다운
[게시물 3] ← 스와이프 다운
  ...
  ↓ 뒤로가기 버튼
HomeScreen (복귀)
```

## 🔧 커스터마이징

### 캐시 설정

`src/hooks/usePostSwipe.ts` 파일에서 수정:

```typescript
const CACHE_TTL = 300;           // 5분 → 원하는 시간(초)
const PREFETCH_THRESHOLD = 2;    // 2개 → 원하는 임계값
const PAGE_SIZE = 10;            // 10개 → 원하는 페이지 크기
```

### 이미지 품질

`src/components/OptimizedImage.tsx` 파일에서 수정:

```typescript
export const IMAGE_SIZES = {
  thumbnail: 150,
  small: 300,
  card: 400,      // ← 조정
  medium: 600,
  detail: 800,
  full: 1200,
};

export const IMAGE_QUALITY = {
  low: 60,
  medium: 75,
  high: 85,       // ← 조정
  max: 95,
};
```

### Skeleton 애니메이션 속도

`src/components/PostDetailSkeleton.tsx` 파일에서 수정:

```typescript
Animated.timing(shimmerAnim, {
  toValue: 1,
  duration: 1000,  // ← 조정 (밀리초)
  useNativeDriver: true,
})
```

### 스크롤 힌트 표시 시간

`src/screens/PostDetail/PostDetailSwipeWrapper.tsx` 파일에서 수정:

```typescript
const timer = setTimeout(() => {
  setShowScrollHint(false);
}, 3000);  // ← 조정 (밀리초)
```

## 🐛 문제 해결

### 문제 1: 스와이프가 작동하지 않음

**원인**: enableSwipe가 전달되지 않음

**해결**:
```typescript
// ❌ 잘못된 코드
navigation.navigate('PostDetail', { postId: 123 });

// ✅ 올바른 코드
navigation.navigate('PostDetail', {
  postId: 123,
  enableSwipe: true
});
```

### 문제 2: 이미지가 표시되지 않음

**원인**: react-native-fast-image 미설치

**해결**:
```bash
# 패키지 설치
npm install react-native-fast-image

# iOS 의존성
cd ios && pod install && cd ..

# 앱 재빌드
npm run ios
# 또는
npm run android
```

### 문제 3: 타입 에러 발생

**원인**: navigation.ts 타입 업데이트 필요

**해결**:
```typescript
// src/types/navigation.ts 확인
PostDetail: {
  postId: number;
  postType?: 'myday' | 'comfort' | 'posts';
  highlightCommentId?: number;
  sourceScreen?: 'home' | 'comfort' | 'profile';
  enableSwipe?: boolean;  // ← 이 줄이 있는지 확인
};
```

### 문제 4: 성능 저하

**원인**: 너무 많은 게시물 렌더링

**해결**:
```typescript
// PostDetailSwipeWrapper.tsx에서 조정
<FlatList
  windowSize={3}              // ← 2로 줄이기
  maxToRenderPerBatch={1}     // ← 1로 줄이기
  removeClippedSubviews={true} // ← 반드시 활성화
/>
```

## 📊 성능 모니터링

### React DevTools 사용

```bash
# Chrome DevTools 열기
npm run devtools
```

### 메모리 사용량 확인

```typescript
// usePostSwipe.ts에 추가
console.log('📊 현재 로드된 게시물:', posts.length);
console.log('📊 현재 인덱스:', currentIndex);
console.log('📊 캐시 크기:', getCacheSize());
```

### 네트워크 요청 모니터링

```bash
# React Native Debugger 사용
# Network 탭에서 API 요청 확인
```

## ✅ 체크리스트

통합 전 확인 사항:

- [ ] PostDetailRouter를 navigation에 등록
- [ ] react-native-fast-image 설치 및 설정
- [ ] HomeScreen에 enableSwipe: true 추가 확인
- [ ] ComfortScreen에 enableSwipe: true 추가 확인
- [ ] navigation.ts 타입 업데이트 확인
- [ ] 앱 재빌드 (iOS/Android)
- [ ] 테스트: 스와이프 동작 확인
- [ ] 테스트: 뒤로가기 버튼 동작 확인
- [ ] 테스트: 이미지 로딩 확인
- [ ] 테스트: 다크모드 색상 확인

## 🚢 배포 전 확인

프로덕션 배포 전:

- [ ] 에러 로그 확인 (Sentry, Firebase 등)
- [ ] 성능 지표 측정 (로딩 시간, 메모리)
- [ ] A/B 테스트 실행 (가능한 경우)
- [ ] 사용자 피드백 수집
- [ ] 롤백 계획 준비

## 📚 추가 리소스

### 관련 문서
- [PostDetail 개선 사항 상세](./src/screens/PostDetail/README_IMPROVEMENTS.md)
- [React Native FlatList 최적화](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [FastImage 문서](https://github.com/DylanVann/react-native-fast-image)

### 코드 참고
- `src/hooks/usePostSwipe.ts` - 스와이프 로직
- `src/components/PostDetailSkeleton.tsx` - Skeleton UI
- `src/screens/PostDetail/PostDetailRouter.tsx` - 라우터
- `src/screens/PostDetail/PostDetailSwipeWrapper.tsx` - Wrapper

## 🎉 완료!

모든 통합 단계가 완료되었습니다. 이제 앱을 실행하고 게시물을 클릭하여 스와이프 기능을 테스트해보세요!

**문제가 발생하면 위의 문제 해결 섹션을 참고하세요.**
