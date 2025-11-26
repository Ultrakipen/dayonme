import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import { Emotion } from '../models/Emotion';
interface ChallengeAttributes {
  challenge_id?: number;
  creator_id: number;
  title: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  is_public: boolean;
  max_participants: number | null;
  participant_count: number;
  status?: 'active' | 'completed' | 'cancelled';
  tags?: string[];
  image_urls?: string[];
  created_at?: Date;
  updated_at?: Date;
}

class Challenge extends Model<ChallengeAttributes> {
public challenge_id!: number;
public creator_id!: number;
public title!: string;
public description?: string;
public start_date!: Date;
public end_date!: Date;
public is_public!: boolean;
public max_participants?: number;
public participant_count!: number;
public status?: 'active' | 'completed' | 'cancelled';
public tags?: string[];
public image_urls?: string[];
public created_at!: Date;
public updated_at!: Date;
public static initialize(sequelize: Sequelize) {
  return Challenge.init(
    {
      challenge_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE', // 변경 - CASCADE 제약 추가
        onUpdate: 'CASCADE'  // 변경 - CASCADE 제약 추가
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      max_participants: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      participant_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      image_urls: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Challenge',
      tableName: 'challenges',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['start_date', 'end_date'] },
        { fields: ['created_at'] },
        { fields: ['creator_id'] },
        // 사용자 증가 대비 성능 최적화 인덱스
        { fields: ['is_public', 'status', 'participant_count'] }, // HOT 챌린지 조회 최적화
        { fields: ['is_public', 'end_date'] }, // 마감 임박 정렬
        { fields: ['is_public', 'created_at'] }, // 최신순 정렬
        { fields: ['participant_count'] }, // 인기순 정렬
      ]
    }
  );
}
public static associate(models: {
  User: typeof User;
  Emotion: typeof Emotion;
  ChallengeParticipant: any;
  ChallengeComment?: any;
}): void {
  Challenge.belongsTo(models.User, {
    foreignKey: 'creator_id',
    as: 'creator'
  });

  Challenge.hasMany(models.ChallengeParticipant, {
    foreignKey: 'challenge_id',
    as: 'challenge_participants'
  });

  Challenge.belongsToMany(models.User, {
    through: models.ChallengeParticipant,
    foreignKey: 'challenge_id',
    otherKey: 'user_id',
    as: 'participants'
  });

  Challenge.belongsToMany(models.Emotion, {
    through: 'challenge_emotions',
    foreignKey: 'challenge_id',
    otherKey: 'emotion_id',
    as: 'emotions'
  });

  // 댓글 연관관계 추가
  if (models.ChallengeComment) {
    Challenge.hasMany(models.ChallengeComment, {
      foreignKey: 'challenge_id',
      as: 'comments'
    });
  }
}
}

export default Challenge;