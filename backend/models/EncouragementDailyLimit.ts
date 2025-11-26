// models/EncouragementDailyLimit.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface EncouragementDailyLimitAttributes {
  id: number;
  user_id: number;
  sent_date: string; // DATEONLY returns string
  count: number;
}

interface EncouragementDailyLimitCreationAttributes {
  user_id: number;
  sent_date: string;
  count?: number;
}

class EncouragementDailyLimit extends Model<EncouragementDailyLimitAttributes, EncouragementDailyLimitCreationAttributes> implements EncouragementDailyLimitAttributes {
  public id!: number;
  public user_id!: number;
  public sent_date!: string;
  public count!: number;

  static initModel(sequelize: Sequelize): typeof EncouragementDailyLimit {
    EncouragementDailyLimit.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        sent_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      {
        sequelize,
        tableName: 'encouragement_daily_limits',
        timestamps: false,
        indexes: [
          {
            unique: true,
            fields: ['user_id', 'sent_date'],
          },
        ],
      }
    );

    return EncouragementDailyLimit;
  }

  static associate(models: any) {
    EncouragementDailyLimit.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

export default EncouragementDailyLimit;
