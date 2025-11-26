'use strict';

/**
 * 추가 성능 최적화 인덱스
 * - 검색 성능 향상
 * - 알림 조회 최적화
 * - 북마크 조회 최적화
 * - 사용자 활동 추적 최적화
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. 검색 최적화 인덱스 (LIKE 검색용 - MySQL FULLTEXT 대체)
      try {
        await queryInterface.addIndex('someone_day_posts', ['title'], {
          name: 'idx_someone_day_posts_title',
          transaction
        });
        await queryInterface.addIndex('someone_day_posts', ['content(255)'], {
          name: 'idx_someone_day_posts_content_prefix',
          transaction
        });
      } catch (e) {
        console.log('검색 인덱스 생성 스킵 (이미 존재할 수 있음)');
      }

      // 2. 알림 테이블 인덱스
      try {
        await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'created_at'], {
          name: 'idx_notifications_user_unread',
          transaction
        });
        await queryInterface.addIndex('notifications', ['user_id', 'type', 'created_at'], {
          name: 'idx_notifications_user_type',
          transaction
        });
      } catch (e) {
        console.log('알림 인덱스 생성 스킵 (이미 존재할 수 있음)');
      }

      // 3. 북마크 테이블 인덱스
      try {
        await queryInterface.addIndex('bookmarks', ['user_id', 'post_type', 'created_at'], {
          name: 'idx_bookmarks_user_type_created',
          transaction
        });
        await queryInterface.addIndex('bookmarks', ['post_id', 'post_type'], {
          name: 'idx_bookmarks_post',
          transaction
        });
      } catch (e) {
        console.log('북마크 인덱스 생성 스킵 (이미 존재할 수 있음)');
      }

      // 4. 좋아요 테이블 복합 인덱스
      try {
        await queryInterface.addIndex('my_day_likes', ['user_id', 'created_at'], {
          name: 'idx_my_day_likes_user_created',
          transaction
        });
        await queryInterface.addIndex('someone_day_likes', ['user_id', 'created_at'], {
          name: 'idx_someone_day_likes_user_created',
          transaction
        });
      } catch (e) {
        console.log('좋아요 인덱스 생성 스킵 (이미 존재할 수 있음)');
      }

      // 5. 사용자 테이블 인덱스 (검색/로그인 최적화)
      try {
        await queryInterface.addIndex('users', ['email'], {
          name: 'idx_users_email',
          unique: true,
          transaction
        });
        await queryInterface.addIndex('users', ['nickname'], {
          name: 'idx_users_nickname',
          transaction
        });
        await queryInterface.addIndex('users', ['is_active', 'created_at'], {
          name: 'idx_users_active_created',
          transaction
        });
      } catch (e) {
        console.log('사용자 인덱스 생성 스킵 (이미 존재할 수 있음)');
      }

      // 6. 챌린지 참여 인덱스
      try {
        await queryInterface.addIndex('challenge_participants', ['user_id', 'joined_at'], {
          name: 'idx_challenge_participants_user_joined',
          transaction
        });
        await queryInterface.addIndex('challenge_participants', ['challenge_id', 'status'], {
          name: 'idx_challenge_participants_challenge_status',
          transaction
        });
      } catch (e) {
        console.log('챌린지 참여 인덱스 생성 스킵 (이미 존재할 수 있음)');
      }

      // 7. 차단 테이블 인덱스
      try {
        await queryInterface.addIndex('user_blocks', ['user_id', 'blocked_user_id'], {
          name: 'idx_user_blocks_user_blocked',
          unique: true,
          transaction
        });
        await queryInterface.addIndex('content_blocks', ['user_id', 'content_type', 'content_id'], {
          name: 'idx_content_blocks_user_content',
          unique: true,
          transaction
        });
      } catch (e) {
        console.log('차단 인덱스 생성 스킵 (이미 존재할 수 있음)');
      }

      console.log('✅ 추가 성능 최적화 인덱스 생성 완료');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const indexesToRemove = [
        { table: 'someone_day_posts', name: 'idx_someone_day_posts_title' },
        { table: 'someone_day_posts', name: 'idx_someone_day_posts_content_prefix' },
        { table: 'notifications', name: 'idx_notifications_user_unread' },
        { table: 'notifications', name: 'idx_notifications_user_type' },
        { table: 'bookmarks', name: 'idx_bookmarks_user_type_created' },
        { table: 'bookmarks', name: 'idx_bookmarks_post' },
        { table: 'my_day_likes', name: 'idx_my_day_likes_user_created' },
        { table: 'someone_day_likes', name: 'idx_someone_day_likes_user_created' },
        { table: 'users', name: 'idx_users_email' },
        { table: 'users', name: 'idx_users_nickname' },
        { table: 'users', name: 'idx_users_active_created' },
        { table: 'challenge_participants', name: 'idx_challenge_participants_user_joined' },
        { table: 'challenge_participants', name: 'idx_challenge_participants_challenge_status' },
        { table: 'user_blocks', name: 'idx_user_blocks_user_blocked' },
        { table: 'content_blocks', name: 'idx_content_blocks_user_content' },
      ];

      for (const { table, name } of indexesToRemove) {
        try {
          await queryInterface.removeIndex(table, name, { transaction });
        } catch (e) {
          // 인덱스가 없을 수 있음
        }
      }

      console.log('✅ 추가 성능 최적화 인덱스 롤백 완료');
    });
  }
};
