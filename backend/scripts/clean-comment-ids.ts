// 기존 댓글에서 comment_id 제거하는 마이그레이션 스크립트
import db from '../models';

async function cleanCommentIds() {
  try {
    console.log('🧹 댓글 내용 정리 시작...');

    // 모든 댓글 조회
    const comments = await db.SomeoneDayComment.findAll();

    console.log(`📊 총 ${comments.length}개의 댓글 발견`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const comment of comments) {
      const originalContent = comment.content;

      // @닉네임[숫자] 또는 @닉네임 [숫자] 패턴 제거
      const cleanedContent = originalContent.replace(/@([^\[]+?)\s*\[\d+\]/g, (match, nickname) => {
        return '@' + nickname.trim();
      });

      // 내용이 변경된 경우에만 업데이트
      if (originalContent !== cleanedContent) {
        await comment.update({ content: cleanedContent });
        updatedCount++;
        console.log(`✅ 댓글 ID ${comment.comment_id} 정리 완료:`);
        console.log(`   이전: ${originalContent.substring(0, 50)}`);
        console.log(`   이후: ${cleanedContent.substring(0, 50)}`);
      } else {
        skippedCount++;
      }
    }

    console.log('\n🎉 정리 완료!');
    console.log(`   업데이트된 댓글: ${updatedCount}개`);
    console.log(`   변경 불필요: ${skippedCount}개`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
cleanCommentIds();
