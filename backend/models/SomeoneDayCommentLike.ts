import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import SomeoneDayComment from '../models/SomeoneDayComment';

interface SomeoneDayCommentLikeAttributes {
  like_id?: number;
  comment_id: number;
  user_id: number;
  created_at?: Date;
}

class SomeoneDayCommentLike extends Model<SomeoneDayCommentLikeAttributes> {
  public like_id!: number;
  public comment_id!: number;
  public user_id!: number;
  public created_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = SomeoneDayCommentLike.init(
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
            model: 'someone_day_comments',
            key: 'comment_id'
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
        modelName: 'SomeoneDayCommentLike',
        tableName: 'someone_day_comment_likes',
        timestamps: false,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['comment_id', 'user_id']
          },
          {
            fields: ['user_id']
          },
          {
            fields: ['created_at']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    User: typeof User;
    SomeoneDayComment: typeof SomeoneDayComment;
  }): void {
    // 댓글과의 관계
    SomeoneDayCommentLike.belongsTo(models.SomeoneDayComment, {
      foreignKey: 'comment_id',
      as: 'comment'
    });

    // 사용자와의 관계
    SomeoneDayCommentLike.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

export default SomeoneDayCommentLike;