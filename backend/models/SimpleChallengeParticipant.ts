// 새로운 간단한 챌린지 참여자 모델
import { Model, DataTypes, Sequelize } from 'sequelize';

interface SimpleChallengeParticipantAttributes {
  challenge_id: number;
  user_id: number;
  joined_at?: Date;
  status: 'active' | 'completed' | 'quit';
  progress_count: number;
}

class SimpleChallengeParticipant extends Model<SimpleChallengeParticipantAttributes> {
  public challenge_id!: number;
  public user_id!: number;
  public joined_at!: Date;
  public status!: 'active' | 'completed' | 'quit';
  public progress_count!: number;

  public static initialize(sequelize: Sequelize) {
    const model = SimpleChallengeParticipant.init(
      {
        challenge_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false
        },
        joined_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        status: {
          type: DataTypes.ENUM('active', 'completed', 'quit'),
          allowNull: false,
          defaultValue: 'active'
        },
        progress_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        sequelize,
        modelName: 'SimpleChallengeParticipant',
        tableName: 'simple_challenge_participants',
        timestamps: false,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['challenge_id', 'user_id']
          },
          {
            fields: ['user_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    SimpleChallengeParticipant.belongsTo(models.SimpleChallenge, {
      foreignKey: 'challenge_id',
      as: 'challenge',
      constraints: false
    });
    SimpleChallengeParticipant.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      constraints: false
    });
  }
}

export { SimpleChallengeParticipant };
export type { SimpleChallengeParticipantAttributes };