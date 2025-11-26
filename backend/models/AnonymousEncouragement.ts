// models/AnonymousEncouragement.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface AnonymousEncouragementAttributes {
  encouragement_id: number;
  to_user_id: number;
  message: string;
  sent_at: Date;
  is_read: boolean;
}

interface AnonymousEncouragementCreationAttributes {
  to_user_id: number;
  message: string;
  sent_at?: Date;
  is_read?: boolean;
}

class AnonymousEncouragement extends Model<AnonymousEncouragementAttributes, AnonymousEncouragementCreationAttributes> implements AnonymousEncouragementAttributes {
  public encouragement_id!: number;
  public to_user_id!: number;
  public message!: string;
  public sent_at!: Date;
  public is_read!: boolean;

  static initModel(sequelize: Sequelize): typeof AnonymousEncouragement {
    AnonymousEncouragement.init(
      {
        encouragement_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        to_user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        message: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        sent_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'anonymous_encouragements',
        timestamps: false,
      }
    );

    return AnonymousEncouragement;
  }

  static associate(models: any) {
    // 받는 사용자
    AnonymousEncouragement.belongsTo(models.User, {
      foreignKey: 'to_user_id',
      as: 'recipient',
    });
  }
}

export default AnonymousEncouragement;
