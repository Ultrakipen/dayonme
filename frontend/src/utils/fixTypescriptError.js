// TypeScript 오류 수정 가이드
// MyPostsScreen.tsx의 426줄 수정

/*
현재 오류가 있는 코드 (426줄):
const diffDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));

수정된 코드:
const diffDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

=== 수정 방법 ===

1. MyPostsScreen.tsx 파일 열기
2. 426줄 찾기
3. (now - postDate) 를 (now.getTime() - postDate.getTime()) 로 변경
4. 저장

=== 완전한 수정된 코드 블록 ===

{(() => {
  console.log('🎯 실시간 날짜 디버깅:', {
    post_id: post.id,
    created_at: post.created_at,
    type: typeof post.created_at,
    length: post.created_at?.length,
    sample: post.created_at?.substring(0, 20)
  });

  // 현재 시간과 비교 테스트
  const now = new Date();
  const postDate = new Date(post.created_at);
  const diffDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

  console.log('📊 날짜 계산 테스트:', {
    now: now.toISOString(),
    postDate: postDate.toISOString(),
    isValid: !isNaN(postDate.getTime()),
    diffDays: diffDays,
    계산결과: diffDays > 0 ? `${diffDays}일 전` : '오늘 또는 미래'
  });

  return formatTimeAgo(post.created_at);
})()}

이렇게 수정하면 TypeScript 오류가 해결되고 정상적으로 디버깅 로그를 볼 수 있습니다.
*/

export default null;