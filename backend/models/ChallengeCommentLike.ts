import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';

interface ChallengeCommentLikeAttributes {
  like_id?: number;
  comment_id: number;
  user_id: number;
  created_at?: Date;
}

class ChallengeCommentLike extends Model<ChallengeCommentLikeAttributes> {
  public static initialize(sequelize: Sequelize) {
    const model = ChallengeCommentLike.init(
      {
        like_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        comment_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'challenge_comments',
            key: 'comment_id'
          }
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'ChallengeCommentLike',
        tableName: 'challenge_comment_likes',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['comment_id']
          },
          {
            fields: ['user_id']
          },
          {
            unique: true,
            fields: ['comment_id', 'user_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    const { User, ChallengeComment } = models;

    ChallengeCommentLike.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    ChallengeCommentLike.belongsTo(ChallengeComment, {
      foreignKey: 'comment_id',
      as: 'comment'
    });
  }
}

export default ChallengeCommentLike;