// models/ChallengeCompletion.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface ChallengeCompletionAttributes {
  completion_id?: number;
  user_id: number;
  challenge_id: number;
  completion_type: '7day' | '21day' | '30day' | 'custom';
  completed_days: number;
  total_emotions_logged: number;
  encouragements_received: number;
  encouragements_given: number;
  top_emotions: string[] | null;
  card_generated: boolean;
  card_shared_count: number;
  completed_at: Date;
  created_at?: Date;
}

class ChallengeCompletion extends Model<ChallengeCompletionAttributes> {
  public completion_id!: number;
  public user_id!: number;
  public challenge_id!: number;
  public completion_type!: '7day' | '21day' | '30day' | 'custom';
  public completed_days!: number;
  public total_emotions_logged!: number;
  public encouragements_received!: number;
  public encouragements_given!: number;
  public top_emotions!: string[] | null;
  public card_generated!: boolean;
  public card_shared_count!: number;
  public completed_at!: Date;
  public created_at!: Date;

  public static initialize(sequelize: Sequelize) {
    return ChallengeCompletion.init(
      {
        completion_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        challenge_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        completion_type: {
          type: DataTypes.ENUM('7day', '21day', '30day', 'custom'),
          allowNull: false,
          defaultValue: '7day',
        },
        completed_days: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        total_emotions_logged: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        encouragements_received: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        encouragements_given: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        top_emotions: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        card_generated: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        card_shared_count: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        completed_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'challenge_completions',
        timestamps: false,
        indexes: [
          { fields: ['user_id', 'challenge_id'] },
          { fields: ['completion_type'] },
          { fields: ['completed_at'] },
        ],
      }
    );
  }

  public static associate(models: any): void {
    ChallengeCompletion.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    ChallengeCompletion.belongsTo(models.Challenge, {
      foreignKey: 'challenge_id',
      as: 'challenge',
    });
  }
}

export type { ChallengeCompletionAttributes };
export default ChallengeCompletion;
