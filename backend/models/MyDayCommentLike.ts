import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import MyDayComment from '../models/MyDayComment';

interface MyDayCommentLikeAttributes {
  like_id?: number;
  comment_id: number;
  user_id: number;
  created_at?: Date;
}

class MyDayCommentLike extends Model<MyDayCommentLikeAttributes> {
  public like_id!: number;
  public comment_id!: number;
  public user_id!: number;
  public created_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = MyDayCommentLike.init(
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
            model: 'my_day_comments',
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
        modelName: 'MyDayCommentLike',
        tableName: 'my_day_comment_likes',
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
    MyDayComment: typeof MyDayComment;
  }): void {
    // 댓글과의 관계
    MyDayCommentLike.belongsTo(models.MyDayComment, {
      foreignKey: 'comment_id',
      as: 'comment'
    });

    // 사용자와의 관계
    MyDayCommentLike.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

export default MyDayCommentLike;