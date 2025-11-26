// scripts/create-dummy-data.ts
import db from '../models';
import bcrypt from 'bcrypt';

const createDummyData = async () => {
  try {
    console.log('🚀 더미 데이터 생성 시작...');

    // 더미 사용자 데이터
    const dummyUsers = [
      {
        username: '행복한하루',
        email: 'happy@test.com',
        password: 'test1234',
        nickname: '행복한하루',
      },
      {
        username: '슬픈고양이',
        email: 'sad@test.com',
        password: 'test1234',
        nickname: '슬픈고양이',
      },
      {
        username: '즐거운친구',
        email: 'joy@test.com',
        password: 'test1234',
        nickname: '즐거운친구',
      },
    ];

    // 사용자 생성
    const createdUsers = [];
    for (const userData of dummyUsers) {
      // 이미 존재하는지 확인
      const existingUser = await db.User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`✅ 사용자 이미 존재: ${userData.nickname}`);
        createdUsers.push(existingUser);
        continue;
      }

      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // 사용자 생성
      const user = await db.User.create({
        username: userData.username,
        email: userData.email,
        password_hash: hashedPassword,
        nickname: userData.nickname,
        is_active: true,
        is_email_verified: true,
      });

      console.log(`✅ 사용자 생성: ${user.nickname} (ID: ${user.user_id})`);
      createdUsers.push(user);
    }

    // 감정 데이터 조회
    const emotions = await db.Emotion.findAll();
    if (emotions.length === 0) {
      console.log('❌ 감정 데이터가 없습니다. 먼저 감정 데이터를 생성해주세요.');
      return;
    }

    console.log(`📊 사용 가능한 감정: ${emotions.length}개`);

    // 더미 게시글 생성 (나의 하루)
    const dummyPosts = [
      {
        content: '오늘 날씨가 정말 좋았어요! 공원에서 산책하면서 기분이 너무 좋아졌습니다. 😊',
        is_anonymous: false,
        emotionIndex: 0,
      },
      {
        content: '요즘 일이 너무 많아서 힘들어요. 하지만 곧 좋은 일이 있을 거라 믿어요!',
        is_anonymous: false,
        emotionIndex: 1,
      },
      {
        content: '친구들과 맛있는 저녁을 먹었어요. 행복한 시간이었습니다! 🍕',
        is_anonymous: false,
        emotionIndex: 2,
      },
      {
        content: '새로운 취미를 시작했어요! 기타 배우는 중인데 재미있네요.',
        is_anonymous: false,
        emotionIndex: 3,
      },
      {
        content: '오늘 하루도 수고 많으셨어요. 내일은 더 좋은 일이 있을 거예요!',
        is_anonymous: false,
        emotionIndex: 0,
      },
    ];

    // 각 사용자마다 게시글 생성
    let postCount = 0;
    for (const user of createdUsers) {
      for (const postData of dummyPosts) {
        const post = await db.MyDayPost.create({
          user_id: user.user_id,
          content: `[${user.nickname}] ${postData.content}`,
          is_anonymous: postData.is_anonymous,
          like_count: Math.floor(Math.random() * 10),
          comment_count: 0,
        });

        // 감정 연결 (MyDayEmotion 중간 테이블)
        const emotionIndex = postData.emotionIndex % emotions.length;
        await db.MyDayEmotion.create({
          post_id: post.post_id,
          emotion_id: emotions[emotionIndex].emotion_id,
        });

        console.log(`✅ 게시글 생성: ${user.nickname}의 게시글 (ID: ${post.post_id})`);
        postCount++;

        // 댓글도 몇 개 추가
        if (postCount % 2 === 0) {
          const otherUser = createdUsers.find(u => u.user_id !== user.user_id);
          if (otherUser) {
            await db.MyDayComment.create({
              content: '좋은 글이네요! 응원합니다 😊',
              user_id: otherUser.user_id,
              post_id: post.post_id,
              is_anonymous: false,
            });

            // comment_count 업데이트
            await post.update({ comment_count: 1 });
            console.log(`  ✅ 댓글 추가: ${otherUser.nickname}`);
          }
        }
      }
    }

    console.log('\n🎉 더미 데이터 생성 완료!');
    console.log(`📊 총 ${createdUsers.length}명의 사용자 생성`);
    console.log(`📊 총 ${postCount}개의 게시글 생성`);
    console.log('\n👤 생성된 사용자 계정:');
    dummyUsers.forEach(user => {
      console.log(`   - 이메일: ${user.email} / 비밀번호: ${user.password} / 닉네임: ${user.nickname}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 더미 데이터 생성 오류:', error);
    process.exit(1);
  }
};

// 스크립트 실행
createDummyData();
