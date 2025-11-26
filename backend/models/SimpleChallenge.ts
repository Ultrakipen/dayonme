// 새로운 간단한 챌린지 모델
import { Model, DataTypes, Sequelize } from 'sequelize';

interface SimpleChallengeAttributes {
  id?: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  creator_id: number;
  status: 'active' | 'completed' | 'cancelled';
  participant_count: number;
  max_participants?: number;
  is_public: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class SimpleChallenge extends Model<SimpleChallengeAttributes> {
  public id!: number;
  public title!: string;
  public description?: string;
  public start_date!: string;
  public end_date!: string;
  public creator_id!: number;
  public status!: 'active' | 'completed' | 'cancelled';
  public participant_count!: number;
  public max_participants?: number;
  public is_public!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = SimpleChallenge.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [3, 200]
          }
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            len: [0, 1000]
          }
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        creator_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('active', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'active'
        },
        participant_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        max_participants: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        is_public: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'SimpleChallenge',
        tableName: 'simple_challenges',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['creator_id']
          },
          {
            fields: ['status']
          },
          {
            fields: ['start_date', 'end_date']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    SimpleChallenge.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
      constraints: false
    });
  }
}

export { SimpleChallenge };
export type { SimpleChallengeAttributes };