'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 기본 감정 데이터 삽입 - 친근한 Inside Out 스타일 감정들
      await queryInterface.bulkInsert('emotions', [
        {
          name: '기쁨이',
          color: '#FFD700',
          icon: '😊',
          description: '기쁘고 즐거운 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '행복이',
          color: '#FFA500',
          icon: '😄',
          description: '행복하고 만족스러운 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '슬픔이',
          color: '#4682B4',
          icon: '😢',
          description: '슬프고 우울한 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '우울이',
          color: '#708090',
          icon: '😞',
          description: '기분이 가라앉는 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '지루미',
          color: '#A9A9A9',
          icon: '😑',
          description: '지루하고 따분한 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '버럭이',
          color: '#FF4500',
          icon: '😠',
          description: '화나고 짜증나는 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '불안이',
          color: '#DDA0DD',
          icon: '😰',
          description: '걱정되고 불안한 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '걱정이',
          color: '#FFA07A',
          icon: '😟',
          description: '걱정스럽고 신경쓰이는 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '감동이',
          color: '#FF6347',
          icon: '🥺',
          description: '마음이 움직이는 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '황당이',
          color: '#20B2AA',
          icon: '🤨',
          description: '어이없고 당황스러운 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '당황이',
          color: '#FF8C00',
          icon: '😲',
          description: '놀랍고 당황스러운 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '짜증이',
          color: '#DC143C',
          icon: '😤',
          description: '화나고 짜증나는 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '무섭이',
          color: '#9370DB',
          icon: '😨',
          description: '무섭고 두려운 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '추억이',
          color: '#87CEEB',
          icon: '🥹',
          description: '그리움과 추억의 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '설렘이',
          color: '#FF69B4',
          icon: '🤗',
          description: '설렘과 두근거림의 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '편안이',
          color: '#98FB98',
          icon: '😌',
          description: '평화롭고 편안한 감정',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '궁금이',
          color: '#DAA520',
          icon: '🤔',
          description: '궁금하고 호기심 많은 감정',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // 기본 태그 데이터 삽입
      await queryInterface.bulkInsert('tags', [
        {
          name: '일상',
          color: '#87CEEB',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '운동',
          color: '#32CD32',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '공부',
          color: '#4169E1',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '취미',
          color: '#FF69B4',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '음식',
          color: '#FF6347',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '여행',
          color: '#FFD700',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '건강',
          color: '#32CD32',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '관계',
          color: '#FF69B4',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      console.log('✅ 기본 데이터 시딩 완료');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('tags', null, { transaction });
      await queryInterface.bulkDelete('emotions', null, { transaction });
      
      console.log('✅ 기본 데이터 시딩 롤백 완료');
    });
  }
};