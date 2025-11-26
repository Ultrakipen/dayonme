// 날짜 디버깅 유틸리티
// MyPostsScreen.tsx에 임시로 추가하여 사용

// 다음 코드를 MyPostsScreen.tsx의 formatTimeAgo 함수 호출 부분에 추가:

/*
// 414줄 근처의 formatTimeAgo(post.created_at) 부분을 다음으로 교체:

{(() => {
  // 실시간 디버깅
  console.log('🎯 실시간 날짜 디버깅:', {
    post_id: post.id,
    created_at: post.created_at,
    type: typeof post.created_at,
    length: post.created_at?.length,
    sample: post.created_at?.substring(0, 20)
  });

  // 현재 시간과 비교
  const now = new Date();
  const postDate = new Date(post.created_at);
  const diffDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));

  console.log('📊 날짜 계산 테스트:', {
    now: now.toISOString(),
    postDate: postDate.toISOString(),
    isValid: !isNaN(postDate.getTime()),
    diffDays: diffDays,
    계산결과: diffDays > 0 ? `${diffDays}일 전` : '오늘 또는 미래'
  });

  return formatTimeAgo(post.created_at);
})()}

이렇게 수정하고 앱을 새로고침하면 콘솔에서 실제 날짜 데이터를 확인할 수 있습니다.

=== 예상 문제들 ===

1. 서버에서 created_at이 null 또는 undefined로 옴
2. 날짜 형식이 예상과 다름 (예: "2024-09-22 14:30:00" vs "2024-09-22T14:30:00.000Z")
3. 타임존 문제 (서버는 UTC, 클라이언트는 로컬 시간)
4. 게시물 정렬 후 날짜가 덮어써짐

=== 즉시 테스트 방법 ===

1. MyPostsScreen.tsx의 413-415줄 찾기:
   <Text className="text-base font-semibold text-gray-500">
     {formatTimeAgo(post.created_at)}
   </Text>

2. 다음으로 교체:
   <Text className="text-base font-semibold text-gray-500">
     {(() => {
       console.log('🎯 Post Date Debug:', {
         id: post.id,
         created_at: post.created_at,
         type: typeof post.created_at
       });
       return formatTimeAgo(post.created_at);
     })()}
   </Text>

3. 앱 새로고침 후 콘솔 확인

이렇게 하면 정확히 어떤 날짜 데이터가 들어오는지 확인할 수 있습니다.
*/

export default null;