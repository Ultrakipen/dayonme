// check-notifications.ts - 알림 데이터 확인 스크립트
import db from './models';
import { QueryTypes } from 'sequelize';

async function checkNotifications() {
  try {
    console.log('📊 데이터베이스 연결 중...\n');

    // 전체 알림 개수
    const totalCount = await db.Notification.count();
    console.log(`전체 알림 개수: ${totalCount}`);

    // 읽지 않은 알림 개수
    const unreadCount = await db.Notification.count({
      where: { is_read: false }
    });
    console.log(`읽지 않은 알림 개수: ${unreadCount}\n`);

    // 사용자별 읽지 않은 알림 개수
    const unreadByUser = await db.sequelize.query(
      'SELECT user_id, COUNT(*) as unread_count FROM notifications WHERE is_read = 0 GROUP BY user_id',
      { type: QueryTypes.SELECT }
    );
    console.log('사용자별 읽지 않은 알림:');
    console.table(unreadByUser);

    // 최근 5개 알림
    const recentNotifications = await db.Notification.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['notification_id', 'user_id', 'notification_type', 'title', 'is_read', 'created_at']
    });
    console.log('\n최근 5개 알림:');
    recentNotifications.forEach(n => {
      const data = n.toJSON() as any;
      console.log(`[${data.notification_id}] User ${data.user_id} - ${data.notification_type} - "${data.title}" - Read: ${data.is_read} - ${data.created_at}`);
    });

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkNotifications();
