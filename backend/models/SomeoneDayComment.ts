import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import SomeoneDayPost from '../models/SomeoneDayPost';

interface SomeoneDayCommentAttributes {
  comment_id?: number;
  post_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  parent_comment_id?: number;
  like_count?: number;
  reply_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

class SomeoneDayComment extends Model<SomeoneDayCommentAttributes> {
  public comment_id!: number;
  public post_id!: number;
  public user_id!: number;
  public content!: string;
  public is_anonymous!: boolean;
  public parent_comment_id!: number | null;
  public like_count!: number;
  public reply_count!: number;

  public static initialize(sequelize: Sequelize) {
    const model = SomeoneDayComment.init(
      {
        comment_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        post_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'someone_day_posts',
            key: 'post_id'
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
        content: {
          type: DataTypes.STRING(500),
          allowNull: false,
          validate: {
            len: [1, 500]
          }
        },
        is_anonymous: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        parent_comment_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'someone_day_comments',
            key: 'comment_id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        like_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        reply_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'SomeoneDayComment',
        tableName: 'someone_day_comments',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['post_id']
          },
          {
            fields: ['user_id']
          },
          {
            fields: ['parent_comment_id']
          },
          {
            fields: ['created_at']
          },
          {
            fields: ['like_count']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    User: typeof User;
    SomeoneDayPost: typeof SomeoneDayPost;
    SomeoneDayCommentLike: any;
  }): void {
    // 게시물과의 관계
    SomeoneDayComment.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });

    // 사용자와의 관계
    SomeoneDayComment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 자기 참조 관계 (댓글의 댓글)
    SomeoneDayComment.belongsTo(SomeoneDayComment, {
      foreignKey: 'parent_comment_id',
      as: 'parent_comment'
    });

    SomeoneDayComment.hasMany(SomeoneDayComment, {
      foreignKey: 'parent_comment_id',
      as: 'replies'
    });

    // 댓글 좋아요와의 관계
    SomeoneDayComment.hasMany(models.SomeoneDayCommentLike, {
      foreignKey: 'comment_id',
      as: 'comment_likes'
    });

    // 사용자와 댓글 좋아요의 다대다 관계
    SomeoneDayComment.belongsToMany(models.User, {
      through: models.SomeoneDayCommentLike,
      foreignKey: 'comment_id',
      otherKey: 'user_id',
      as: 'liked_by_users'
    });
  }
}

export default SomeoneDayComment;