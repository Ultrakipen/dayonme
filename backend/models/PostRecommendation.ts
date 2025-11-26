import { Model, DataTypes, Sequelize } from 'sequelize';
import SomeoneDayPost from '../models/SomeoneDayPost';

interface PostRecommendationAttributes {
  recommendation_id: number;
  post_id: number;
  recommended_post_id: number;
  post_type: 'my_day' | 'someone_day';
  reason?: string;
}

class PostRecommendation extends Model<PostRecommendationAttributes> {
  public recommendation_id!: number;
  public post_id!: number;
  public recommended_post_id!: number;
  public post_type!: 'my_day' | 'someone_day';
  public reason?: string;

  public static initialize(sequelize: Sequelize) {
    const model = PostRecommendation.init(
      {
        recommendation_id: {
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
          }
        },
        recommended_post_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'someone_day_posts',
            key: 'post_id'
          }
        },
        post_type: {
          type: DataTypes.ENUM('my_day', 'someone_day'),
          allowNull: false
        },
        reason: {
          type: DataTypes.STRING(100),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'PostRecommendation',
        tableName: 'post_recommendations',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['post_id']
          },
          {
            fields: ['recommended_post_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    SomeoneDayPost: typeof SomeoneDayPost;
  }): void {
    PostRecommendation.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });

    PostRecommendation.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'recommended_post_id',
      as: 'recommendedPost'
    });
  }
}

export default PostRecommendation;