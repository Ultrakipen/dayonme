'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      console.log('🔧 외래 키 제약 조건 수정 시작...');

      // 1. my_day_posts 테이블의 외래 키 수정
      console.log('  - my_day_posts 테이블 외래 키 수정 중...');

      // 기존 외래 키 삭제 (제약 조건 이름 확인 필요)
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE my_day_posts DROP FOREIGN KEY my_day_posts_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    my_day_posts_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      // 새로운 외래 키 추가 (user_id)
      await queryInterface.sequelize.query(
        `ALTER TABLE my_day_posts
         ADD CONSTRAINT my_day_posts_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 2. my_day_comments 테이블의 외래 키 수정
      console.log('  - my_day_comments 테이블 외래 키 수정 중...');

      // post_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE my_day_comments DROP FOREIGN KEY my_day_comments_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    my_day_comments_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE my_day_comments
         ADD CONSTRAINT my_day_comments_post_fk
         FOREIGN KEY (post_id) REFERENCES my_day_posts(post_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // user_id 외래 키 (문제의 제약 조건)
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE my_day_comments DROP FOREIGN KEY my_day_comments_ibfk_6`,
          { transaction }
        );
      } catch (e) {
        console.log('    my_day_comments_ibfk_6 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE my_day_comments
         ADD CONSTRAINT my_day_comments_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 3. someone_day_posts 테이블의 외래 키 수정
      console.log('  - someone_day_posts 테이블 외래 키 수정 중...');

      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE someone_day_posts DROP FOREIGN KEY someone_day_posts_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    someone_day_posts_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE someone_day_posts
         ADD CONSTRAINT someone_day_posts_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 4. someone_day_comments 테이블의 외래 키 수정
      console.log('  - someone_day_comments 테이블 외래 키 수정 중...');

      // post_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE someone_day_comments DROP FOREIGN KEY someone_day_comments_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    someone_day_comments_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE someone_day_comments
         ADD CONSTRAINT someone_day_comments_post_fk
         FOREIGN KEY (post_id) REFERENCES someone_day_posts(post_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // user_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE someone_day_comments DROP FOREIGN KEY someone_day_comments_ibfk_2`,
          { transaction }
        );
      } catch (e) {
        console.log('    someone_day_comments_ibfk_2 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE someone_day_comments
         ADD CONSTRAINT someone_day_comments_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 5. challenges 테이블의 외래 키 수정
      console.log('  - challenges 테이블 외래 키 수정 중...');

      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE challenges DROP FOREIGN KEY challenges_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    challenges_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE challenges
         ADD CONSTRAINT challenges_creator_fk
         FOREIGN KEY (creator_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 6. challenge_participants 테이블의 외래 키 수정
      console.log('  - challenge_participants 테이블 외래 키 수정 중...');

      // challenge_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE challenge_participants DROP FOREIGN KEY challenge_participants_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    challenge_participants_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE challenge_participants
         ADD CONSTRAINT challenge_participants_challenge_fk
         FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // user_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE challenge_participants DROP FOREIGN KEY challenge_participants_ibfk_2`,
          { transaction }
        );
      } catch (e) {
        console.log('    challenge_participants_ibfk_2 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE challenge_participants
         ADD CONSTRAINT challenge_participants_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 7. challenge_emotions 테이블의 외래 키 수정
      console.log('  - challenge_emotions 테이블 외래 키 수정 중...');

      // challenge_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE challenge_emotions DROP FOREIGN KEY challenge_emotions_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    challenge_emotions_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE challenge_emotions
         ADD CONSTRAINT challenge_emotions_challenge_fk
         FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // user_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE challenge_emotions DROP FOREIGN KEY challenge_emotions_ibfk_2`,
          { transaction }
        );
      } catch (e) {
        console.log('    challenge_emotions_ibfk_2 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE challenge_emotions
         ADD CONSTRAINT challenge_emotions_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // emotion_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE challenge_emotions DROP FOREIGN KEY challenge_emotions_ibfk_3`,
          { transaction }
        );
      } catch (e) {
        console.log('    challenge_emotions_ibfk_3 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE challenge_emotions
         ADD CONSTRAINT challenge_emotions_emotion_fk
         FOREIGN KEY (emotion_id) REFERENCES emotions(emotion_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 8. content_blocks 테이블의 외래 키 수정
      console.log('  - content_blocks 테이블 외래 키 수정 중...');

      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE content_blocks DROP FOREIGN KEY content_blocks_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    content_blocks_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE content_blocks
         ADD CONSTRAINT content_blocks_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 9. user_blocks 테이블의 외래 키 수정
      console.log('  - user_blocks 테이블 외래 키 수정 중...');

      // user_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE user_blocks DROP FOREIGN KEY user_blocks_ibfk_1`,
          { transaction }
        );
      } catch (e) {
        console.log('    user_blocks_ibfk_1 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE user_blocks
         ADD CONSTRAINT user_blocks_user_fk
         FOREIGN KEY (user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // blocked_user_id 외래 키
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE user_blocks DROP FOREIGN KEY user_blocks_ibfk_2`,
          { transaction }
        );
      } catch (e) {
        console.log('    user_blocks_ibfk_2 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE user_blocks
         ADD CONSTRAINT user_blocks_blocked_user_fk
         FOREIGN KEY (blocked_user_id) REFERENCES users(user_id)
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 10. emotion_id 관련 외래 키 수정 (SET NULL로 유지)
      console.log('  - emotion_id 외래 키는 SET NULL로 유지 (감정 삭제 시)...');

      // my_day_posts의 emotion_id
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE my_day_posts DROP FOREIGN KEY my_day_posts_ibfk_2`,
          { transaction }
        );
      } catch (e) {
        console.log('    my_day_posts_ibfk_2 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE my_day_posts
         ADD CONSTRAINT my_day_posts_emotion_fk
         FOREIGN KEY (emotion_id) REFERENCES emotions(emotion_id)
         ON DELETE SET NULL ON UPDATE CASCADE`,
        { transaction }
      );

      // someone_day_posts의 emotion_id
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE someone_day_posts DROP FOREIGN KEY someone_day_posts_ibfk_2`,
          { transaction }
        );
      } catch (e) {
        console.log('    someone_day_posts_ibfk_2 제약 조건이 존재하지 않거나 이미 삭제됨');
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE someone_day_posts
         ADD CONSTRAINT someone_day_posts_emotion_fk
         FOREIGN KEY (emotion_id) REFERENCES emotions(emotion_id)
         ON DELETE SET NULL ON UPDATE CASCADE`,
        { transaction }
      );

      console.log('✅ 외래 키 제약 조건 수정 완료!');
      console.log('');
      console.log('🔑 수정된 외래 키 목록:');
      console.log('  ✓ my_day_posts → users (CASCADE)');
      console.log('  ✓ my_day_posts → emotions (SET NULL)');
      console.log('  ✓ my_day_comments → my_day_posts (CASCADE)');
      console.log('  ✓ my_day_comments → users (CASCADE)');
      console.log('  ✓ someone_day_posts → users (CASCADE)');
      console.log('  ✓ someone_day_posts → emotions (SET NULL)');
      console.log('  ✓ someone_day_comments → someone_day_posts (CASCADE)');
      console.log('  ✓ someone_day_comments → users (CASCADE)');
      console.log('  ✓ challenges → users (CASCADE)');
      console.log('  ✓ challenge_participants → challenges (CASCADE)');
      console.log('  ✓ challenge_participants → users (CASCADE)');
      console.log('  ✓ challenge_emotions → challenges (CASCADE)');
      console.log('  ✓ challenge_emotions → users (CASCADE)');
      console.log('  ✓ challenge_emotions → emotions (CASCADE)');
      console.log('  ✓ content_blocks → users (CASCADE)');
      console.log('  ✓ user_blocks → users (CASCADE)');
      console.log('');
      console.log('이제 사용자를 삭제하면 관련된 모든 데이터가 자동으로 삭제됩니다.');
    });
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⚠️  이 마이그레이션의 롤백은 권장되지 않습니다.');
    console.log('외래 키를 원래 상태(NO ACTION)로 되돌리면 사용자 삭제 시 오류가 발생합니다.');
    // 롤백은 구현하지 않음 (데이터 무결성을 위해)
  }
};
