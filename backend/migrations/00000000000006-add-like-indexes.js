'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Like 테이블 복합 인덱스 (조회 성능 최적화)
      await queryInterface.addIndex('my_day_likes', ['post_id', 'user_id'], {
        name: 'idx_my_day_likes_post_user',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('someone_day_likes', ['post_id', 'user_id'], {
        name: 'idx_someone_day_likes_post_user',
        unique: true,
        transaction
      });

      // 사용자별 좋아요 조회 최적화
      await queryInterface.addIndex('my_day_likes', ['user_id', 'created_at'], {
        name: 'idx_my_day_likes_user_created',
        transaction
      });

      await queryInterface.addIndex('someone_day_likes', ['user_id', 'created_at'], {
        name: 'idx_someone_day_likes_user_created',
        transaction
      });

      // Notification 테이블 인덱스
      await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'created_at'], {
        name: 'idx_notifications_user_read_created',
        transaction
      });

      console.log('✅ Like 및 Notification 인덱스 생성 완료');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const indexes = [
        { table: 'my_day_likes', name: 'idx_my_day_likes_post_user' },
        { table: 'someone_day_likes', name: 'idx_someone_day_likes_post_user' },
        { table: 'my_day_likes', name: 'idx_my_day_likes_user_created' },
        { table: 'someone_day_likes', name: 'idx_someone_day_likes_user_created' },
        { table: 'notifications', name: 'idx_notifications_user_read_created' }
      ];

      for (const { table, name } of indexes) {
        try {
          await queryInterface.removeIndex(table, name, { transaction });
        } catch (e) {
          console.warn(`인덱스 ${name} 제거 실패:`, e.message);
        }
      }

      console.log('✅ Like 및 Notification 인덱스 롤백 완료');
    });
  }
};
