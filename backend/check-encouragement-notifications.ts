// check-encouragement-notifications.ts - 격려 메시지와 알림 상태 확인
import db from './models';
import { QueryTypes } from 'sequelize';

async function checkEncouragementNotifications() {
  try {
    console.log('📊 격려 메시지와 알림 상태 확인 중...\n');

    // 1. 전체 격려 메시지 개수
    const totalMessages = await db.EncouragementMessage.count();
    console.log(`전체 격려 메시지 개수: ${totalMessages}`);

    // 2. 최근 격려 메시지 10개 조회
    const recentMessages = await db.EncouragementMessage.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      attributes: ['message_id', 'sender_id', 'receiver_id', 'post_id', 'message', 'is_anonymous', 'created_at']
    });

    console.log('\n최근 10개 격려 메시지:');
    console.table(recentMessages.map(m => {
      const data = m.toJSON() as any;
      return {
        message_id: data.message_id,
        sender: data.sender_id,
        receiver: data.receiver_id,
        post_id: data.post_id,
        anonymous: data.is_anonymous,
        created: data.created_at
      };
    }));

    // 3. 각 격려 메시지에 대한 알림 존재 여부 확인
    console.log('\n각 격려 메시지에 대한 알림 존재 여부:');
    for (const msg of recentMessages) {
      const data = msg.toJSON() as any;
      const notification = await db.Notification.findOne({
        where: {
          notification_type: 'encouragement',
          related_id: data.message_id
        }
      });

      console.log(`메시지 ID ${data.message_id}: ${notification ? '✅ 알림 존재' : '❌ 알림 없음'}`);
    }

    // 4. 알림이 없는 격려 메시지 개수
    const messagesWithoutNotifications = await db.sequelize.query(`
      SELECT COUNT(*) as count
      FROM encouragement_messages em
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.notification_type = 'encouragement'
        AND n.related_id = em.message_id
      )
      AND em.sender_id != em.receiver_id
    `, { type: QueryTypes.SELECT }) as any[];

    console.log(`\n알림이 없는 격려 메시지 개수: ${messagesWithoutNotifications[0].count}`);

    // 5. 사용자별 받은 격려 메시지 vs 알림 개수
    const userStats = await db.sequelize.query(`
      SELECT
        em.receiver_id,
        COUNT(em.message_id) as received_messages,
        COUNT(n.notification_id) as notifications
      FROM encouragement_messages em
      LEFT JOIN notifications n ON n.notification_type = 'encouragement'
        AND n.related_id = em.message_id
      WHERE em.sender_id != em.receiver_id
      GROUP BY em.receiver_id
    `, { type: QueryTypes.SELECT });

    console.log('\n사용자별 격려 메시지 vs 알림 개수:');
    console.table(userStats);

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkEncouragementNotifications();
