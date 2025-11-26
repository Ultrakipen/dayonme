// scripts/updateEmotions.js - 데이터베이스의 감정 데이터를 새로운 친근한 감정들로 업데이트

const db = require('../models');
const { QueryTypes } = require('sequelize');

const newEmotions = [
  { emotion_id: 1, name: '기쁨이', icon: '😊', color: '#FFD700', description: '기쁘고 즐거운 감정' },
  { emotion_id: 2, name: '행복이', icon: '😄', color: '#FFA500', description: '행복하고 만족스러운 감정' },
  { emotion_id: 3, name: '슬픔이', icon: '😢', color: '#4682B4', description: '슬프고 우울한 감정' },
  { emotion_id: 4, name: '우울이', icon: '😞', color: '#708090', description: '기분이 가라앉는 감정' },
  { emotion_id: 5, name: '지루미', icon: '😑', color: '#A9A9A9', description: '지루하고 따분한 감정' },
  { emotion_id: 6, name: '버럭이', icon: '😠', color: '#FF4500', description: '화나고 짜증나는 감정' },
  { emotion_id: 7, name: '불안이', icon: '😰', color: '#DDA0DD', description: '걱정되고 불안한 감정' },
  { emotion_id: 8, name: '걱정이', icon: '😟', color: '#FFA07A', description: '걱정스럽고 신경쓰이는 감정' },
  { emotion_id: 9, name: '감동이', icon: '🥺', color: '#FF6347', description: '마음이 움직이는 감정' },
  { emotion_id: 10, name: '황당이', icon: '🤨', color: '#20B2AA', description: '어이없고 당황스러운 감정' },
  { emotion_id: 11, name: '당황이', icon: '😲', color: '#FF8C00', description: '놀랍고 당황스러운 감정' },
  { emotion_id: 12, name: '짜증이', icon: '😤', color: '#DC143C', description: '화나고 짜증나는 감정' },
  { emotion_id: 13, name: '무섭이', icon: '😨', color: '#9370DB', description: '무섭고 두려운 감정' },
  { emotion_id: 14, name: '추억이', icon: '🥹', color: '#87CEEB', description: '그리움과 추억의 감정' },
  { emotion_id: 15, name: '설렘이', icon: '🤗', color: '#FF69B4', description: '설렘과 두근거림의 감정' },
  { emotion_id: 16, name: '편안이', icon: '😌', color: '#98FB98', description: '평화롭고 편안한 감정' },
  { emotion_id: 17, name: '궁금이', icon: '🤔', color: '#DAA520', description: '궁금하고 호기심 많은 감정' },
  { emotion_id: 18, name: '사랑이', icon: '❤️', color: '#E91E63', description: '사랑스럽고 따뜻한 감정' },
  { emotion_id: 19, name: '아픔이', icon: '🤕', color: '#8B4513', description: '아프고 힘든 감정' },
  { emotion_id: 20, name: '욕심이', icon: '🤑', color: '#32CD32', description: '욕심나고 탐내는 감정' }
];

async function updateEmotions() {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('🔄 감정 데이터 업데이트 시작...');
    
    // 1. 기존 감정 데이터 확인
    const existingEmotions = await db.sequelize.query(
      'SELECT emotion_id, name FROM emotions ORDER BY emotion_id',
      { type: QueryTypes.SELECT, transaction }
    );
    
    console.log('📊 기존 감정 데이터:', existingEmotions.map(e => `${e.emotion_id}: ${e.name}`));
    
    // 2. 기존 감정 데이터 삭제 (cascade로 관련 데이터도 함께 삭제됨)
    console.log('🗑️ 기존 감정 데이터 삭제 중...');
    await db.sequelize.query('DELETE FROM emotions', { transaction });
    
    // 3. 새로운 감정 데이터 삽입
    console.log('📝 새로운 감정 데이터 삽입 중...');
    for (const emotion of newEmotions) {
      await db.sequelize.query(
        `INSERT INTO emotions (emotion_id, name, icon, color, description, created_at, updated_at) 
         VALUES (:emotion_id, :name, :icon, :color, :description, NOW(), NOW())`,
        {
          replacements: {
            emotion_id: emotion.emotion_id,
            name: emotion.name,
            icon: emotion.icon,
            color: emotion.color,
            description: emotion.description
          },
          transaction
        }
      );
    }
    
    // 4. 업데이트된 데이터 확인
    const updatedEmotions = await db.sequelize.query(
      'SELECT emotion_id, name, icon, color FROM emotions ORDER BY emotion_id',
      { type: QueryTypes.SELECT, transaction }
    );
    
    console.log('✅ 업데이트된 감정 데이터:');
    updatedEmotions.forEach(emotion => {
      console.log(`   ${emotion.emotion_id}: ${emotion.name} ${emotion.icon} (${emotion.color})`);
    });
    
    await transaction.commit();
    console.log('🎉 감정 데이터 업데이트 완료!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ 감정 데이터 업데이트 실패:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  updateEmotions()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = updateEmotions;