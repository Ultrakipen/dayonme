import db from '../models';

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    const emotions = await db.Emotion.findAll({
      attributes: ['name', 'icon', 'temperature'],
      order: [['temperature', 'ASC']]
    });

    console.log('\n현재 감정별 온도:');
    emotions.forEach((e: any) => {
      console.log(`${e.name} ${e.icon}: ${e.temperature}도`);
    });

    await db.sequelize.close();
  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
})();
