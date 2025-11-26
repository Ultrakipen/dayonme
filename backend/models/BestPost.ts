import { Model, DataTypes, Sequelize } from 'sequelize';
import SomeoneDayPost from '../models/SomeoneDayPost';

interface BestPostAttributes {
  best_post_id: number;
  post_id: number;
  post_type: 'my_day' | 'someone_day';
  category: 'weekly' | 'monthly';
  start_date: Date;
  end_date: Date;
}

class BestPost extends Model<BestPostAttributes> {
  public best_post_id!: number;
  public post_id!: number;
  public post_type!: 'my_day' | 'someone_day';
  public category!: 'weekly' | 'monthly';
  public start_date!: Date;
  public end_date!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = BestPost.init(
      {
        best_post_id: {
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
        post_type: {
          type: DataTypes.ENUM('my_day', 'someone_day'),
          allowNull: false
        },
        category: {
          type: DataTypes.ENUM('weekly', 'monthly'),
          allowNull: false
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'BestPost',
        tableName: 'best_posts',
        timestamps: true,
        underscored: true
      }
    );
    return model;
  }

  public static associate(models: {
    SomeoneDayPost: typeof SomeoneDayPost;
  }): void {
    BestPost.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });
  }
}

export default BestPost;