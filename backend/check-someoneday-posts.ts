// check-someoneday-posts.ts - 누군가의 하루 게시물 확인
import db from './models';

async function checkSomeoneDayPosts() {
  try {
    console.log('📊 누군가의 하루 게시물 확인 중...\n');

    // 전체 게시물 개수
    const totalPosts = await db.SomeoneDayPost.count();
    console.log(`전체 게시물 개수: ${totalPosts}`);

    // 최근 게시물 5개
    const recentPosts = await db.SomeoneDayPost.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['user_id', 'nickname']
      }],
      attributes: ['post_id', 'user_id', 'title', 'content', 'is_anonymous', 'comment_count', 'created_at']
    });

    console.log('\n최근 5개 게시물:');
    recentPosts.forEach(post => {
      const data = post.toJSON() as any;
      console.log(`\n[게시물 ${data.post_id}]`);
      console.log(`  작성자: User ${data.user_id} (${data.is_anonymous ? '익명' : data.user?.nickname})`);
      console.log(`  제목: ${data.title}`);
      console.log(`  댓글 수: ${data.comment_count}`);
      console.log(`  작성일: ${data.created_at}`);
    });

    // 사용자 2037의 게시물
    const user2037Posts = await db.SomeoneDayPost.findAll({
      where: { user_id: 2037 },
      order: [['created_at', 'DESC']],
      limit: 3,
      attributes: ['post_id', 'title', 'comment_count', 'created_at']
    });

    console.log(`\n사용자 2037의 게시물 (${user2037Posts.length}개):`);
    user2037Posts.forEach(post => {
      const data = post.toJSON() as any;
      console.log(`  게시물 ${data.post_id}: "${data.title}" (댓글: ${data.comment_count})`);
    });

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkSomeoneDayPosts();
