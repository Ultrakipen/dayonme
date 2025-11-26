// 새로운 간단한 챌린지 감정 기록 모델
import { Model, DataTypes, Sequelize } from 'sequelize';

interface SimpleChallengeEmotionAttributes {
  id?: number;
  challenge_id: number;
  user_id: number;
  emotion_id: number;
  log_date: string;
  note?: string;
  created_at?: Date;
}

class SimpleChallengeEmotion extends Model<SimpleChallengeEmotionAttributes> {
  public id!: number;
  public challenge_id!: number;
  public user_id!: number;
  public emotion_id!: number;
  public log_date!: string;
  public note?: string;
  public readonly created_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = SimpleChallengeEmotion.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        challenge_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        emotion_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        log_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        note: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'SimpleChallengeEmotion',
        tableName: 'simple_challenge_emotions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
          {
            fields: ['challenge_id', 'user_id', 'log_date']
          },
          {
            fields: ['user_id', 'log_date']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    SimpleChallengeEmotion.belongsTo(models.SimpleChallenge, {
      foreignKey: 'challenge_id',
      as: 'challenge',
      constraints: false
    });
    SimpleChallengeEmotion.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      constraints: false
    });
    SimpleChallengeEmotion.belongsTo(models.Emotion, {
      foreignKey: 'emotion_id',
      as: 'emotion',
      constraints: false
    });
  }
}

export { SimpleChallengeEmotion };
export type { SimpleChallengeEmotionAttributes };