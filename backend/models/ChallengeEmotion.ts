import { Model, DataTypes, Sequelize } from 'sequelize';
import Challenge from './Challenge';
import { Emotion } from './Emotion';
import { User } from './User';

interface ChallengeEmotionAttributes {
  challenge_emotion_id?: number;
  challenge_id: number;
  user_id: number;
  emotion_id: number;
  log_date: Date | string;
  note?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

class ChallengeEmotion extends Model<ChallengeEmotionAttributes> {
  public challenge_emotion_id!: number;
  public challenge_id!: number;
  public user_id!: number;
  public emotion_id!: number;
  public log_date!: Date;
  public note?: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = ChallengeEmotion.init(
      {
        challenge_emotion_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        challenge_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'challenge_id'
          }
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        emotion_id: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          references: {
            model: 'emotions',
            key: 'emotion_id'
          }
        },
        log_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        note: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'ChallengeEmotion',
        tableName: 'challenge_emotions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        indexes: [
          {
            fields: ['challenge_id', 'user_id', 'emotion_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    ChallengeEmotion.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    ChallengeEmotion.belongsTo(models.Challenge, {
      foreignKey: 'challenge_id',
      as: 'challenge'
    });

    ChallengeEmotion.belongsTo(models.Emotion, {
      foreignKey: 'emotion_id',
      as: 'emotion'
    });
  }
}

export type { ChallengeEmotionAttributes };
export default ChallengeEmotion;