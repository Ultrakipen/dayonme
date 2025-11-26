import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';

interface ChallengeLikeAttributes {
  like_id?: number;
  challenge_id: number;
  user_id: number;
  created_at?: Date;
}

class ChallengeLike extends Model<ChallengeLikeAttributes> {
  public static initialize(sequelize: Sequelize) {
    const model = ChallengeLike.init(
      {
        like_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        challenge_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'challenge_id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'ChallengeLike',
        tableName: 'challenge_likes',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['challenge_id']
          },
          {
            fields: ['user_id']
          },
          {
            unique: true,
            fields: ['challenge_id', 'user_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    const { User, Challenge } = models;

    ChallengeLike.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    ChallengeLike.belongsTo(Challenge, {
      foreignKey: 'challenge_id',
      as: 'challenge'
    });
  }
}

export default ChallengeLike;
