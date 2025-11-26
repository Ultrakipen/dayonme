# HomeScreen 리팩토링 가이드

## 📁 구조
```
HomeScreen/
├── hooks/
│   ├── useHomeData.ts         ✅ 완료 - 게시물 로딩 & 상태 관리
│   └── usePostActions.ts      ✅ 완료 - 좋아요, 북마크, 삭제
├── types.ts                   ✅ 완료 - 타입 정의
└── README.md                  이 파일
```

## ✅ 완료된 작업

### 1. hooks/useHomeData.ts
**역할:** 게시물 데이터 로딩 및 상태 관리
- ✅ loadPosts() - 게시물 불러오기 (캐싱, 네트워크 확인)
- ✅ posts, isRefreshing, loadingPosts 상태
- ✅ bookmarkedPosts, likedPosts 상태
- ✅ 익명 사용자 관리

### 2. hooks/usePostActions.ts
**역할:** 게시물 인터랙션
- ✅ handleLike() - 좋아요 토글
- ✅ handleBookmark() - 북마크 토글 (낙관적 업데이트)
- ✅ deletePost() - 게시물 삭제
- ✅ 비로그인 사용자 로그인 유도
- ✅ 네트워크 오프라인 체크

### 3. types.ts
**역할:** 타입 정의 통합
- ✅ DisplayPost, ExtendedComment, AnonymousUser, LocalEmotion

## 🔧 기존 HomeScreen.tsx 사용법 (점진적 마이그레이션)

### Step 1: hooks import 추가
```typescript
// HomeScreen.tsx 상단에 추가
import { useHomeData } from './HomeScreen/hooks/useHomeData';
import { usePostActions } from './HomeScreen/hooks/usePostActions';
import { DisplayPost, ExtendedComment, AnonymousUser } from './HomeScreen/types';
```

### Step 2: 기존 상태를 hooks로 교체 (선택적)
```typescript
// 기존 (309-315줄 부근)
const [posts, setPosts] = useState<DisplayPost[]>([]);
const [isRefreshing, setIsRefreshing] = useState(false);
const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
// ... 등등

// 교체 후
const homeData = useHomeData({
  isAuthenticated,
  isConnected,
  processCommentsWithAnonymous, // 기존 함수 전달
});

const postActions = usePostActions({
  isAuthenticated,
  isConnected,
  user,
  posts: homeData.posts,
  setPosts: homeData.setPosts,
  likedPosts: homeData.likedPosts,
  setLikedPosts: homeData.setLikedPosts,
  bookmarkedPosts: homeData.bookmarkedPosts,
  setBookmarkedPosts: homeData.setBookmarkedPosts,
  setEmotionLoginPromptAction,
  setEmotionLoginPromptVisible,
});
```

### Step 3: 기존 함수 교체
```typescript
// 기존 (3037줄)
const loadPosts = async (forceRefresh: boolean = false) => { ... }

// 삭제하고 homeData.loadPosts 사용

// 기존 (2872줄, 2954줄)
const handleLike = useCallback(async (postId: number) => { ... }
const handleBookmark = useCallback(async (postId: number) => { ... }

// 삭제하고 postActions.handleLike, postActions.handleBookmark 사용
```

## 🎯 권장 마이그레이션 순서

### Phase 1: hooks 검증 (현재)
- [x] useHomeData, usePostActions 생성
- [ ] 백업 파일로 테스트 (HomeScreen.test.tsx)

### Phase 2: 점진적 교체
1. processCommentsWithAnonymous 함수만 남기고 loadPosts 교체
2. handleLike, handleBookmark 교체
3. 댓글 관련 로직 분리 (useCommentActions.ts 추가)

### Phase 3: 컴포넌트 분리
4. PostsList.tsx - FlatList 게시물 목록
5. CreatePostSection.tsx - 글쓰기 영역
6. HeaderSection.tsx - 상단 헤더

## ⚠️ 주의사항

1. **백업 확인**: `HomeScreen.tsx.backup` 파일이 존재하는지 확인
2. **점진적 교체**: 한번에 모든 것을 교체하지 말고, 하나씩 테스트
3. **의존성**: processCommentsWithAnonymous 같은 기존 함수는 먼저 분리
4. **테스트**: 각 단계마다 앱이 정상 작동하는지 확인

## 📊 파일 크기 비교 (예상)

| 항목 | 현재 | 목표 |
|------|------|------|
| HomeScreen.tsx | 5,430줄 | ~800줄 |
| hooks/ | 0 | ~600줄 |
| components/ | 0 | ~1,200줄 |
| **총합** | 5,430줄 | 2,600줄 (중복 제거) |

## 🚀 다음 단계

useHomeData와 usePostActions를 실제로 사용하려면:
```bash
# 테스트 환경에서 먼저 검증
npm run android  # 또는 npm run ios
```

hooks가 잘 작동하면, 점진적으로 기존 함수를 교체하세요.
