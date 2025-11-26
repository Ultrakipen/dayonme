import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';

// 데이터베이스 연결 설정
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: console.log
});

// MyDayPost 모델 정의 ("나의 하루" 게시물)
const MyDayPost = sequelize.define('MyDayPost', {
  post_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  emotion_summary: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  character_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'my_day_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// SomeoneDayPost 모델 정의 ("위로와 공감" 게시물)
const SomeoneDayPost = sequelize.define('SomeoneDayPost', {
  post_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  summary: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  character_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'someone_day_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

async function createSamplePosts() {
  try {
    console.log('🔄 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 기존 게시물 확인
    const existingMyDayPosts = await MyDayPost.findAll();
    const existingSomeoneDayPosts = await SomeoneDayPost.findAll();

    if (existingMyDayPosts.length > 0 || existingSomeoneDayPosts.length > 0) {
      console.log('📝 기존 게시물이 존재합니다.');
      
      if (process.env.RECREATE_POSTS === 'true') {
        console.log('🔄 기존 게시물 삭제 중...');
        await MyDayPost.destroy({ where: {} });
        await SomeoneDayPost.destroy({ where: {} });
        console.log('✅ 기존 게시물 삭제 완료');
      } else {
        console.log('⚠️  기존 게시물을 유지합니다.');
        console.log('⚠️  재생성을 원하면 RECREATE_POSTS=true 환경변수를 설정하세요.');
        return;
      }
    }

    // "나의 하루" 샘플 게시물 데이터
    const myDayPostsData = [
      {
        user_id: 1, // testuser1
        content: '오늘은 정말 좋은 날이었어요! 오랜만에 친구들과 카페에서 만나서 이야기하며 시간을 보냈습니다. 맛있는 커피와 함께하는 대화가 이렇게 행복할 줄 몰랐네요. 😊',
        emotion_summary: '행복, 만족',
        is_anonymous: true,
        character_count: 89,
        like_count: 5,
        comment_count: 2,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2일 전
      },
      {
        user_id: 2, // testuser2  
        content: '새로운 취미로 요리를 시작했어요! 오늘은 첫 번째 도전으로 파스타를 만들어 봤는데, 생각보다 맛있게 나와서 정말 뿌듯했습니다. 다음엔 뭘 만들어볼까요?',
        emotion_summary: '뿌듯함, 기대',
        is_anonymous: false,
        character_count: 81,
        like_count: 8,
        comment_count: 4,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1일 전
      },
      {
        user_id: 3, // developer
        content: '오늘 드디어 미뤄두었던 책을 다 읽었어요! 정말 감동적인 내용이었고, 많은 생각을 하게 되었습니다. 독서의 즐거움을 다시 한번 느꼈네요. 📚',
        emotion_summary: '감동, 뿌듯함',
        is_anonymous: true,
        character_count: 71,
        like_count: 3,
        comment_count: 1,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12시간 전
      },
      {
        user_id: 1, // testuser1
        content: '비오는 날엔 집에서 음악을 들으며 여유로운 시간을 보내는 것도 좋네요. 평소 바쁜 일상에서 벗어나 나만의 시간을 가질 수 있어서 좋았어요.',
        emotion_summary: '평온, 여유',
        is_anonymous: false,
        character_count: 75,
        like_count: 7,
        comment_count: 3,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6시간 전
      },
      {
        user_id: 2, // testuser2
        content: '오늘 운동을 처음 시작했어요! 조금 힘들었지만 운동 후의 상쾌함이 정말 좋네요. 꾸준히 해서 건강한 생활을 만들어보려고 합니다. 💪',
        emotion_summary: '상쾌함, 의지',
        is_anonymous: true,
        character_count: 68,
        like_count: 12,
        comment_count: 5,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3시간 전
      }
    ];

    // "위로와 공감" 샘플 게시물 데이터
    const someoneDayPostsData = [
      {
        user_id: 1, // testuser1
        title: '새로운 시작이 두려워요',
        content: '다음 달에 새로운 직장으로 이직을 하게 되었습니다. 좋은 기회라고 생각하지만 한편으로는 너무 두려워요. 새로운 환경, 새로운 사람들... 잘 적응할 수 있을까요? 이직 경험이 있으신 분들의 조언을 듣고 싶어요.',
        summary: '새로운 직장으로의 이직이 두렵고 조언이 필요합니다.',
        is_anonymous: true,
        character_count: 117,
        like_count: 15,
        comment_count: 8,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3일 전
      },
      {
        user_id: 2, // testuser2
        title: '자신감을 잃었어요',
        content: '최근 들어 뭘 해도 잘 안되고, 실수만 연발하고 있어요. 예전에는 자신감이 넘쳤는데 지금은 뭘 해도 \'내가 이걸 제대로 할 수 있을까?\' 하는 생각만 들어요. 자신감을 되찾는 방법이 있을까요?',
        summary: '최근 실수가 잦아지면서 자신감을 많이 잃었습니다.',
        is_anonymous: false,
        character_count: 107,
        like_count: 23,
        comment_count: 12,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2일 전
      },
      {
        user_id: 3, // developer
        title: '외로움이 너무 커요',
        content: '혼자 사는 게 이렇게 외로울 줄 몰랐어요. 특히 주말이나 저녁시간에 혼자 있으면 정말 쓸쓸해져요. 친구들은 각자 바쁘고, 연인도 없고... 이 외로움을 어떻게 달래야 할까요? 혼자서도 행복할 수 있는 방법이 있을까요?',
        summary: '혼자 사는 삶에서 느끼는 외로움이 너무 커서 고민입니다.',
        is_anonymous: true,
        character_count: 121,
        like_count: 31,
        comment_count: 15,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1일 전
      },
      {
        user_id: 1, // testuser1
        title: '미래가 막막해요',
        content: '20대 후반인데 아직도 뭘 하고 싶은지, 어떻게 살아야 할지 모르겠어요. 주변 친구들은 다들 확실한 목표가 있어 보이는데 저만 길을 잃은 것 같아요. 이런 제가 이상한 건가요? 어떻게 하면 제 길을 찾을 수 있을까요?',
        summary: '미래에 대한 확실한 방향을 찾지 못해 막막한 상황입니다.',
        is_anonymous: false,
        character_count: 121,
        like_count: 18,
        comment_count: 9,
        created_at: new Date(Date.now() - 18 * 60 * 60 * 1000) // 18시간 전
      },
      {
        user_id: 2, // testuser2
        title: '스트레스가 너무 심해요',
        content: '요즘 회사 업무가 너무 많아서 스트레스를 많이 받고 있어요. 야근도 잦아지고, 쉴 시간도 없고... 이런 상황이 계속되면 몸과 마음이 지칠 것 같아요. 스트레스를 효과적으로 관리하는 방법이 있을까요?',
        summary: '과도한 업무로 인한 스트레스 관리 방법을 찾고 있습니다.',
        is_anonymous: true,
        character_count: 105,
        like_count: 27,
        comment_count: 11,
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8시간 전
      }
    ];

    // "나의 하루" 게시물 생성
    console.log('🔄 "나의 하루" 게시물 생성 중...');
    const createdMyDayPosts = await MyDayPost.bulkCreate(myDayPostsData);
    console.log(`✅ ${createdMyDayPosts.length}개의 "나의 하루" 게시물이 생성되었습니다!`);

    // "위로와 공감" 게시물 생성
    console.log('🔄 "위로와 공감" 게시물 생성 중...');
    const createdSomeoneDayPosts = await SomeoneDayPost.bulkCreate(someoneDayPostsData);
    console.log(`✅ ${createdSomeoneDayPosts.length}개의 "위로와 공감" 게시물이 생성되었습니다!`);

    console.log('\n📝 생성된 게시물 요약:');
    console.log(`   • "나의 하루" 게시물: ${createdMyDayPosts.length}개`);
    console.log(`   • "위로와 공감" 게시물: ${createdSomeoneDayPosts.length}개`);
    console.log(`   • 총 게시물: ${createdMyDayPosts.length + createdSomeoneDayPosts.length}개`);

    console.log('\n🎯 이제 앱에서 다음을 확인할 수 있습니다:');
    console.log('   • 홈화면의 "누군가의 하루는.." 섹션에 게시물이 표시됩니다');
    console.log('   • "위로와 공감" 페이지에 고민 게시물들이 표시됩니다');
    console.log('   • 각 게시물은 좋아요와 댓글 수를 가지고 있습니다');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
    console.log('🔄 데이터베이스 연결 종료');
  }
}

// 메인 실행
if (require.main === module) {
  console.log('🚀 샘플 게시물 생성 스크립트 시작\n');
  
  createSamplePosts()
    .then(() => {
      console.log('\n🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { createSamplePosts };