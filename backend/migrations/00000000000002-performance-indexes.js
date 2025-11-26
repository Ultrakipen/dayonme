'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. MyDay Posts 성능 인덱스
      await queryInterface.addIndex('my_day_posts', ['created_at'], { 
        name: 'idx_my_day_posts_created_at',
        transaction 
      });
      await queryInterface.addIndex('my_day_posts', ['like_count', 'comment_count', 'created_at'], { 
        name: 'idx_my_day_posts_popularity',
        transaction 
      });
      await queryInterface.addIndex('my_day_posts', ['user_id', 'created_at'], { 
        name: 'idx_my_day_posts_user_created',
        transaction 
      });

      // 2. SomeoneDay Posts 성능 인덱스
      await queryInterface.addIndex('someone_day_posts', ['created_at'], { 
        name: 'idx_someone_day_posts_created_at',
        transaction 
      });
      await queryInterface.addIndex('someone_day_posts', ['like_count', 'comment_count', 'created_at'], { 
        name: 'idx_someone_day_posts_popularity',
        transaction 
      });
      await queryInterface.addIndex('someone_day_posts', ['user_id', 'created_at'], { 
        name: 'idx_someone_day_posts_user_created',
        transaction 
      });
      await queryInterface.addIndex('someone_day_posts', ['is_anonymous', 'created_at'], { 
        name: 'idx_someone_day_posts_anonymous_created',
        transaction 
      });

      // 3. Comments 성능 인덱스
      await queryInterface.addIndex('my_day_comments', ['post_id', 'created_at'], { 
        name: 'idx_my_day_comments_post_created',
        transaction 
      });
      await queryInterface.addIndex('someone_day_comments', ['post_id', 'created_at'], { 
        name: 'idx_someone_day_comments_post_created',
        transaction 
      });
      await queryInterface.addIndex('someone_day_comments', ['post_id', 'like_count', 'created_at'], { 
        name: 'idx_someone_day_comments_post_likes',
        transaction 
      });

      // 4. Challenge 관련 인덱스
      await queryInterface.addIndex('challenges', ['start_date', 'end_date'], { 
        name: 'idx_challenges_dates',
        transaction 
      });
      await queryInterface.addIndex('challenges', ['is_public', 'status', 'created_at'], { 
        name: 'idx_challenges_public_status',
        transaction 
      });

      // 5. Emotion Logs 인덱스
      await queryInterface.addIndex('challenge_emotions', ['user_id', 'log_date'], { 
        name: 'idx_challenge_emotions_user_date',
        transaction 
      });

      // 6. 태그 관련 인덱스 (향후 확장용)
      await queryInterface.addIndex('tags', ['usage_count'], { 
        name: 'idx_tags_usage_count',
        transaction 
      });

      console.log('✅ 성능 최적화 인덱스 생성 완료');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 인덱스 제거
      const indexes = [
        'idx_my_day_posts_created_at',
        'idx_my_day_posts_popularity',
        'idx_my_day_posts_user_created',
        'idx_someone_day_posts_created_at',
        'idx_someone_day_posts_popularity',
        'idx_someone_day_posts_user_created',
        'idx_someone_day_posts_anonymous_created',
        'idx_my_day_comments_post_created',
        'idx_someone_day_comments_post_created',
        'idx_someone_day_comments_post_likes',
        'idx_challenges_dates',
        'idx_challenges_public_status',
        'idx_challenge_emotions_user_date',
        'idx_tags_usage_count'
      ];

      for (const indexName of indexes) {
        try {
          await queryInterface.removeIndex('my_day_posts', indexName, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
        try {
          await queryInterface.removeIndex('someone_day_posts', indexName, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
        try {
          await queryInterface.removeIndex('my_day_comments', indexName, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
        try {
          await queryInterface.removeIndex('someone_day_comments', indexName, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
        try {
          await queryInterface.removeIndex('challenges', indexName, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
        try {
          await queryInterface.removeIndex('challenge_emotions', indexName, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
        try {
          await queryInterface.removeIndex('tags', indexName, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
      }

      console.log('✅ 성능 최적화 인덱스 롤백 완료');
    });
  }
};