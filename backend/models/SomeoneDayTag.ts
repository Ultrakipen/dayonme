import { Model, DataTypes, Sequelize } from 'sequelize';
import SomeoneDayPost from '../models/SomeoneDayPost';
import Tag from '../models/Tag';

interface SomeoneDayTagAttributes {
  post_id: number;
  tag_id: number;
}

class SomeoneDayTag extends Model<SomeoneDayTagAttributes> {
  public post_id!: number;
  public tag_id!: number;

  public static initialize(sequelize: Sequelize) {
    const model = SomeoneDayTag.init(
      {
        post_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          references: {
            model: 'someone_day_posts',
            key: 'post_id'
          }
        },
        tag_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          references: {
            model: 'tags',
            key: 'tag_id'
          }
        }
      },
      {
        sequelize,
        modelName: 'SomeoneDayTag',
        tableName: 'someone_day_tags',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['post_id']
          },
          {
            fields: ['tag_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    SomeoneDayPost: typeof SomeoneDayPost;
    Tag: typeof Tag;
  }): void {
    SomeoneDayTag.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });
    
    SomeoneDayTag.belongsTo(models.Tag, {
      foreignKey: 'tag_id',
      as: 'tag'
    });
  }
}

export default SomeoneDayTag;