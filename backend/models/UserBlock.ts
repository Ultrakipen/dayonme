import { Model, DataTypes, Sequelize } from 'sequelize';

interface UserBlockAttributes {
  user_id: number;
  blocked_user_id: number;
  reason?: string;
}

class UserBlock extends Model<UserBlockAttributes> {
  public static initialize(sequelize: Sequelize): typeof UserBlock {
    return UserBlock.init(
      {
        user_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'users', key: 'user_id' },
        },
        blocked_user_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'users', key: 'user_id' },
        },
        reason: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'UserBlock',
        tableName: 'user_blocks',
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    );
  }

  public static associate(models: any): void {
    UserBlock.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    UserBlock.belongsTo(models.User, {
      foreignKey: 'blocked_user_id',
      as: 'blocked_user', 
      onDelete: 'CASCADE'
    });
  }
}

export default UserBlock;