// backend/models/UserIntention.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

export interface UserIntentionAttributes {
  intention_id?: number;
  user_id: number;
  period: 'week' | 'month' | 'year';
  intention_text: string;
  created_at?: Date;
  updated_at?: Date;
}

class UserIntention extends Model<UserIntentionAttributes> {
  public intention_id!: number;
  public user_id!: number;
  public period!: 'week' | 'month' | 'year';
  public intention_text!: string;
  public created_at!: Date;
  public updated_at!: Date;

  public static initialize(sequelize: Sequelize): typeof UserIntention {
    const model = UserIntention.init(
      {
        intention_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        period: {
          type: DataTypes.ENUM('week', 'month', 'year'),
          allowNull: false
        },
        intention_text: {
          type: DataTypes.STRING(500),
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'UserIntention',
        tableName: 'user_intentions',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['user_id', 'period'],
            unique: true
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    UserIntention.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      constraints: false
    });
  }
}

export default UserIntention;
