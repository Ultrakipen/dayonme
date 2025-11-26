// scripts/forceUpdateEmotions.js - 강제로 감정 데이터를 업데이트

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

const newEmotions = [
  { name: '기쁨이', icon: '😊', color: '#FFD700', description: '기쁘고 즐거운 감정' },
  { name: '행복이', icon: '😄', color: '#FFA500', description: '행복하고 만족스러운 감정' },
  { name: '슬픔이', icon: '😢', color: '#4682B4', description: '슬프고 우울한 감정' },
  { name: '우울이', icon: '😞', color: '#708090', description: '기분이 가라앉는 감정' },
  { name: '지루미', icon: '😑', color: '#A9A9A9', description: '지루하고 따분한 감정' },
  { name: '버럭이', icon: '😠', color: '#FF4500', description: '화나고 짜증나는 감정' },
  { name: '불안이', icon: '😰', color: '#DDA0DD', description: '걱정되고 불안한 감정' },
  { name: '걱정이', icon: '😟', color: '#FFA07A', description: '걱정스럽고 신경쓰이는 감정' },
  { name: '감동이', icon: '🥺', color: '#FF6347', description: '마음이 움직이는 감정' },
  { name: '황당이', icon: '🤨', color: '#20B2AA', description: '어이없고 당황스러운 감정' },
  { name: '당황이', icon: '😲', color: '#FF8C00', description: '놀랍고 당황스러운 감정' },
  { name: '짜증이', icon: '😤', color: '#DC143C', description: '화나고 짜증나는 감정' },
  { name: '무섭이', icon: '😨', color: '#9370DB', description: '무섭고 두려운 감정' },
  { name: '추억이', icon: '🥹', color: '#87CEEB', description: '그리움과 추억의 감정' },
  { name: '설렘이', icon: '🤗', color: '#FF69B4', description: '설렘과 두근거림의 감정' },
  { name: '편안이', icon: '😌', color: '#98FB98', description: '평화롭고 편안한 감정' },
  { name: '궁금이', icon: '🤔', color: '#DAA520', description: '궁금하고 호기심 많은 감정' }
];

async function forceUpdateEmotions() {
  try {
    console.log('🔄 백엔드 API를 통해 감정 데이터 강제 업데이트 시작...');
    
    // 1. 현재 감정 목록 조회
    console.log('📊 현재 감정 목록 조회 중...');
    const currentEmotions = await axios.get(`${API_BASE_URL}/emotions`);
    console.log(`현재 감정 개수: ${currentEmotions.data.data.length}개`);
    console.log('현재 감정들:', currentEmotions.data.data.map(e => `${e.emotion_id}: ${e.name}`));
    
    console.log('\n⚠️  새로운 감정 데이터로 교체하려면 데이터베이스를 직접 수정해야 합니다.');
    console.log('🔧 대신 getAllEmotions 함수에서 강제로 새 데이터를 생성하도록 수정합니다...');
    
    return {
      success: false,
      message: 'API를 통한 직접 수정은 불가능합니다. 데이터베이스를 직접 수정해야 합니다.',
      currentEmotions: currentEmotions.data.data
    };
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

// 스크립트 실행
if (require.main === module) {
  forceUpdateEmotions()
    .then((result) => {
      console.log('\n결과:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = forceUpdateEmotions;