import { Model, DataTypes, Sequelize } from 'sequelize';

class UserGoal extends Model {
  public static initialize(sequelize: Sequelize) {
    return UserGoal.init(
      {
        goal_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        target_emotion_id: {
          type: DataTypes.TINYINT.UNSIGNED,  // INTEGER에서 TINYINT.UNSIGNED로 변경
          allowNull: false,
          references: {
            model: 'emotions',
            key: 'emotion_id'
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
        progress: {
          type: DataTypes.DECIMAL(5, 4),
          allowNull: false,
          defaultValue: 0.0000
        },
        is_completed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      },
      {
        sequelize,
        modelName: 'UserGoal',
        tableName: 'user_goals',
        timestamps: true,
        underscored: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      }
    );
}

  public static associate(models: any) {
    UserGoal.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    UserGoal.belongsTo(models.Emotion, {
      foreignKey: 'target_emotion_id',
      as: 'targetEmotion'
    });
  }
}

export default UserGoal;