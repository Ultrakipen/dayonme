'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // challenges 테이블에 image_urls 컬럼 추가 (최대 3장)
      await queryInterface.addColumn('challenges', 'image_urls', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of image URLs (max 3 images)'
      }, { transaction });

      console.log('✅ challenges 테이블에 image_urls 컬럼 추가 완료');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('challenges', 'image_urls', { transaction });
      console.log('✅ challenges 테이블에서 image_urls 컬럼 제거 완료');
    });
  }
};
