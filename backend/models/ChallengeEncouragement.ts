// models/ChallengeEncouragement.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface ChallengeEncouragementAttributes {
  encouragement_id?: number;
  challenge_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  emotion_type?: string | null;
  is_anonymous: boolean;
  is_read: boolean;
  sent_at: Date;
  read_at?: Date | null;
}

class ChallengeEncouragement extends Model<ChallengeEncouragementAttributes> {
  public encouragement_id!: number;
  public challenge_id!: number;
  public sender_id!: number;
  public receiver_id!: number;
  public message!: string;
  public emotion_type!: string | null;
  public is_anonymous!: boolean;
  public is_read!: boolean;
  public sent_at!: Date;
  public read_at!: Date | null;

  public static initialize(sequelize: Sequelize) {
    return ChallengeEncouragement.init(
      {
        encouragement_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        challenge_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        sender_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        receiver_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        message: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        emotion_type: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        is_anonymous: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        sent_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        read_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'challenge_encouragements',
        timestamps: false,
        // 인덱스는 마이그레이션으로 수동 생성 (DB 유저 ALTER 권한 없음)
      }
    );
  }

  public static associate(models: any): void {
    ChallengeEncouragement.belongsTo(models.Challenge, {
      foreignKey: 'challenge_id',
      as: 'challenge',
    });
    ChallengeEncouragement.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
    });
    ChallengeEncouragement.belongsTo(models.User, {
      foreignKey: 'receiver_id',
      as: 'receiver',
    });
  }
}

export type { ChallengeEncouragementAttributes };
export default ChallengeEncouragement;
