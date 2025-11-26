import db from '../models';

// 체온 기반 감정 온도 매핑
const emotionTemperatures: Record<string, number> = {
  // 차가움 (34.0-35.0도) - 부정적 감정
  '우울이': 34.0,
  '아픔이': 34.5,
  '슬픔이': 34.5,
  '지루미': 35.0,

  // 조금 낮음 (35.0-36.4도) - 걱정, 불안
  '무섭이': 35.3,
  '불안이': 35.5,
  '걱정이': 35.8,
  '당황이': 36.0,

  // 정상 (36.5-37.4도) - 평온, 일상
  '편안이': 36.5,
  '궁금이': 36.8,
  '추억이': 37.0,

  // 따뜻함 (37.5-38.4도) - 긍정적 감정
  '기쁨이': 37.5,
  '감동이': 37.8,
  '행복이': 38.0,
  '설렘이': 38.2,

  // 뜨거움 (38.5-40.0도) - 강한 감정
  '황당이': 38.5,
  '욕심이': 38.7,
  '짜증이': 38.8,
  '사랑이': 39.0,
  '버럭이': 39.5,
};

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. temperature 컬럼 추가
    console.log('\n📝 temperature 컬럼 추가 중...');
    await db.sequelize.query(`
      ALTER TABLE emotions
      ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,1) NULL
      COMMENT '체온 기반 감정 온도 (34.0 ~ 40.0)'
    `);
    console.log('✅ temperature 컬럼 추가 완료');

    // 2. 각 감정에 온도 값 설정
    console.log('\n🌡️  감정별 온도 설정 중...');
    for (const [emotionName, temperature] of Object.entries(emotionTemperatures)) {
      await db.Emotion.update(
        { temperature },
        { where: { name: emotionName } }
      );
      console.log(`  ${emotionName}: ${temperature}도`);
    }
    console.log('✅ 감정별 온도 설정 완료');

    // 3. 결과 확인
    console.log('\n📊 최종 확인:');
    const emotions = await db.Emotion.findAll({
      attributes: ['name', 'icon', 'temperature'],
      order: [['temperature', 'ASC']]
    });

    console.log('\n차가움 (34.0-35.0도):');
    emotions.filter((e: any) => e.temperature && e.temperature < 35.1).forEach((e: any) => {
      console.log(`  ${e.name} ${e.icon}: ${e.temperature}도`);
    });

    console.log('\n조금 낮음 (35.0-36.4도):');
    emotions.filter((e: any) => e.temperature && e.temperature >= 35.1 && e.temperature < 36.5).forEach((e: any) => {
      console.log(`  ${e.name} ${e.icon}: ${e.temperature}도`);
    });

    console.log('\n정상 (36.5-37.4도):');
    emotions.filter((e: any) => e.temperature && e.temperature >= 36.5 && e.temperature < 37.5).forEach((e: any) => {
      console.log(`  ${e.name} ${e.icon}: ${e.temperature}도`);
    });

    console.log('\n따뜻함 (37.5-38.4도):');
    emotions.filter((e: any) => e.temperature && e.temperature >= 37.5 && e.temperature < 38.5).forEach((e: any) => {
      console.log(`  ${e.name} ${e.icon}: ${e.temperature}도`);
    });

    console.log('\n뜨거움 (38.5-40.0도):');
    emotions.filter((e: any) => e.temperature && e.temperature >= 38.5).forEach((e: any) => {
      console.log(`  ${e.name} ${e.icon}: ${e.temperature}도`);
    });

    await db.sequelize.close();
    console.log('\n✅ 모든 작업 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
})();
