// scripts/updateEmotions.ts - 데이터베이스의 감정 데이터를 새로운 친근한 감정들로 업데이트

import db from '../models';
import { QueryTypes } from 'sequelize';

const newEmotions = [
  { emotion_id: 1, name: '기쁨이', icon: '😊', color: '#FFD700' },
  { emotion_id: 2, name: '행복이', icon: '😄', color: '#FFA500' },
  { emotion_id: 3, name: '슬픔이', icon: '😢', color: '#4682B4' },
  { emotion_id: 4, name: '우울이', icon: '😞', color: '#708090' },
  { emotion_id: 5, name: '지루미', icon: '😑', color: '#A9A9A9' },
  { emotion_id: 6, name: '버럭이', icon: '😠', color: '#FF4500' },
  { emotion_id: 7, name: '불안이', icon: '😰', color: '#DDA0DD' },
  { emotion_id: 8, name: '걱정이', icon: '😟', color: '#FFA07A' },
  { emotion_id: 9, name: '감동이', icon: '🥺', color: '#FF6347' },
  { emotion_id: 10, name: '황당이', icon: '🤨', color: '#20B2AA' },
  { emotion_id: 11, name: '당황이', icon: '😲', color: '#FF8C00' },
  { emotion_id: 12, name: '짜증이', icon: '😤', color: '#DC143C' },
  { emotion_id: 13, name: '무섭이', icon: '😨', color: '#9370DB' },
  { emotion_id: 14, name: '추억이', icon: '🥹', color: '#87CEEB' },
  { emotion_id: 15, name: '설렘이', icon: '🤗', color: '#FF69B4' },
  { emotion_id: 16, name: '편안이', icon: '😌', color: '#98FB98' },
  { emotion_id: 17, name: '궁금이', icon: '🤔', color: '#DAA520' },
  { emotion_id: 18, name: '사랑이', icon: '❤️', color: '#E91E63' },
  { emotion_id: 19, name: '아픔이', icon: '🤕', color: '#8B4513' },
  { emotion_id: 20, name: '욕심이', icon: '🤑', color: '#32CD32' }
];

async function updateEmotions() {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('🔄 감정 데이터 업데이트 시작...');
    
    // 1. 기존 감정 데이터 확인
    const existingEmotions = await db.sequelize.query(
      'SELECT emotion_id, name FROM emotions ORDER BY emotion_id',
      { type: QueryTypes.SELECT, transaction }
    ) as any[];
    
    console.log('📊 기존 감정 데이터:', existingEmotions.map(e => `${e.emotion_id}: ${e.name}`));
    
    // 2. 누락된 감정만 찾기
    const existingIds = existingEmotions.map(e => e.emotion_id);
    const missingEmotions = newEmotions.filter(emotion => !existingIds.includes(emotion.emotion_id));
    
    console.log('📝 누락된 감정들:', missingEmotions.map(e => `${e.emotion_id}: ${e.name}`));
    
    // 3. 누락된 감정 데이터만 삽입
    if (missingEmotions.length > 0) {
      console.log('📝 누락된 감정 데이터 삽입 중...');
      for (const emotion of missingEmotions) {
        await db.sequelize.query(
          `INSERT INTO emotions (emotion_id, name, icon, color, created_at, updated_at) 
           VALUES (:emotion_id, :name, :icon, :color, NOW(), NOW())`,
          {
            replacements: {
              emotion_id: emotion.emotion_id,
              name: emotion.name,
              icon: emotion.icon,
              color: emotion.color
            },
            transaction
          }
        );
      }
    } else {
      console.log('✅ 누락된 감정이 없습니다.');
    }
    
    // 4. 업데이트된 데이터 확인
    const updatedEmotions = await db.sequelize.query(
      'SELECT emotion_id, name, icon, color FROM emotions ORDER BY emotion_id',
      { type: QueryTypes.SELECT, transaction }
    ) as any[];
    
    console.log('✅ 최종 감정 데이터:');
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

export default updateEmotions;