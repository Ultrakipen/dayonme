'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // user_blocks 테이블에 reason 컬럼 추가
      await queryInterface.addColumn(
        'user_blocks',
        'reason',
        {
          type: Sequelize.STRING(100),
          allowNull: true,
          after: 'blocked_user_id'
        },
        { transaction }
      );

      console.log('✅ user_blocks 테이블에 reason 컬럼 추가 완료');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // reason 컬럼 제거
      await queryInterface.removeColumn('user_blocks', 'reason', { transaction });

      console.log('✅ user_blocks 테이블에서 reason 컬럼 제거 완료');
    });
  }
};
