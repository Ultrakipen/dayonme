import { Model, DataTypes, Sequelize } from 'sequelize';

export interface EmotionAttributes {
  emotion_id: number;
  name: string;
  icon: string;
  color: string;
  temperature?: number;
  created_at?: Date;
  updated_at?: Date;
}
interface EmotionLogAttributes {
  log_id?: number;  // optional로 변경
  user_id: number;
  emotion_id: number;
  log_date: Date;
  note: string | null;
}
export class Emotion extends Model<EmotionAttributes> {
  public emotion_id!: number;
  public name!: string;
  public icon!: string;
  public color!: string;
  public temperature?: number;
  public created_at!: Date;
  public updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = Emotion.init(
      {
        emotion_id: {
          type: DataTypes.TINYINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        icon: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        color: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        temperature: {
          type: DataTypes.DECIMAL(3, 1),
          allowNull: true,
          comment: '체온 기반 감정 온도 (34.0 ~ 40.0)'
        }
      },
      {
        sequelize,
        modelName: 'Emotion',
        tableName: 'emotions',
        timestamps: true,
        underscored: true
      }
    );
    return model;
  }
}

// 기본 감정 데이터 - 친근한 Inside Out 스타일 감정들
export const defaultEmotions = [
  { name: '기쁨이', description: '기쁘고 즐거운 감정', icon: '😊', color: '#FFD700' },
  { name: '행복이', description: '행복하고 만족스러운 감정', icon: '😄', color: '#FFA500' },
  { name: '슬픔이', description: '슬프고 우울한 감정', icon: '😢', color: '#4682B4' },
  { name: '우울이', description: '기분이 가라앉는 감정', icon: '😞', color: '#708090' },
  { name: '지루미', description: '지루하고 따분한 감정', icon: '😑', color: '#A9A9A9' },
  { name: '버럭이', description: '화나고 짜증나는 감정', icon: '😠', color: '#FF4500' },
  { name: '불안이', description: '걱정되고 불안한 감정', icon: '😰', color: '#DDA0DD' },
  { name: '걱정이', description: '걱정스럽고 신경쓰이는 감정', icon: '😟', color: '#FFA07A' },
  { name: '감동이', description: '마음이 움직이는 감정', icon: '🥺', color: '#FF6347' },
  { name: '황당이', description: '어이없고 당황스러운 감정', icon: '🤨', color: '#20B2AA' },
  { name: '당황이', description: '놀랍고 당황스러운 감정', icon: '😲', color: '#FF8C00' },
  { name: '짜증이', description: '화나고 짜증나는 감정', icon: '😤', color: '#DC143C' },
  { name: '무섭이', description: '무섭고 두려운 감정', icon: '😨', color: '#9370DB' },
  { name: '추억이', description: '그리움과 추억의 감정', icon: '🥰', color: '#87CEEB' },
  { name: '설렘이', description: '설렘과 두근거림의 감정', icon: '🤗', color: '#FF69B4' },
  { name: '편안이', description: '평화롭고 편안한 감정', icon: '😌', color: '#98FB98' },
  { name: '궁금이', description: '궁금하고 호기심 많은 감정', icon: '🤔', color: '#DAA520' },
  { name: '사랑이', description: '사랑과 애정의 감정', icon: '❤️', color: '#E91E63' },
  { name: '아픔이', description: '아프고 힘든 감정', icon: '🤕', color: '#8B4513' },
  { name: '욕심이', description: '욕심과 욕구의 감정', icon: '🤑', color: '#32CD32' }
];