import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';

interface ChallengeCommentAttributes {
  comment_id?: number;
  challenge_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  parent_comment_id?: number;
  challenge_emotion_id?: number; // 감정 나누기 전용 댓글
  created_at?: Date;
}

class ChallengeComment extends Model<ChallengeCommentAttributes> {
  public comment_id!: number;
  public challenge_id!: number;
  public user_id!: number;
  public content!: string;
  public is_anonymous!: boolean;
  public parent_comment_id?: number;
  public challenge_emotion_id?: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Association properties
  public user?: any;
  public replies?: ChallengeComment[];
  public likes?: any[];

  public static initialize(sequelize: Sequelize) {
    const model = ChallengeComment.init(
      {
        comment_id: {
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
        content: {
          type: DataTypes.STRING(500),
          allowNull: false
        },
        is_anonymous: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false
        },
        parent_comment_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'challenge_comments',
            key: 'comment_id'
          }
        },
        challenge_emotion_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'challenge_emotions',
            key: 'challenge_emotion_id'
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
        modelName: 'ChallengeComment',
        tableName: 'challenge_comments',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['challenge_id']
          },
          {
            fields: ['user_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    const { User, Challenge, ChallengeCommentLike } = models;

    ChallengeComment.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    ChallengeComment.belongsTo(Challenge, {
      foreignKey: 'challenge_id',
      as: 'challenge'
    });

    // Self-association for parent-child comments
    ChallengeComment.belongsTo(ChallengeComment, {
      foreignKey: 'parent_comment_id',
      as: 'parent'
    });

    ChallengeComment.hasMany(ChallengeComment, {
      foreignKey: 'parent_comment_id',
      as: 'replies'
    });

    // Comment likes relationship (will be created if needed)
    if (ChallengeCommentLike) {
      ChallengeComment.hasMany(ChallengeCommentLike, {
        foreignKey: 'comment_id',
        as: 'likes'
      });
    }
  }
}

export default ChallengeComment;