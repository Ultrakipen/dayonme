import { Model, DataTypes, Sequelize } from 'sequelize';

class UserStats extends Model {
  public static initialize(sequelize: Sequelize) {
    return UserStats.init(
      {
        user_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        my_day_post_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        someone_day_post_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        my_day_like_received_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        someone_day_like_received_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        my_day_comment_received_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        someone_day_comment_received_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        my_day_like_given_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        my_day_comment_given_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        challenge_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        last_updated: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'UserStats',
        tableName: 'user_stats',
        timestamps: false  // createdAt, updatedAt 필드를 사용하지 않음
      }
    );
  }

  public static associate(models: any): void {
    UserStats.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  }
}

export default UserStats;