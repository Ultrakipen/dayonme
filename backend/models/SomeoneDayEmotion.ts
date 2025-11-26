// backend/models/SomeoneDayEmotion.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import SomeoneDayPost from '../models/SomeoneDayPost';
import { Emotion } from '../models/Emotion';

interface SomeoneDayEmotionAttributes {
  post_id: number;
  emotion_id: number;
}

class SomeoneDayEmotion extends Model<SomeoneDayEmotionAttributes> {
  public post_id!: number;
  public emotion_id!: number;

  public static initialize(sequelize: Sequelize) {
    const model = SomeoneDayEmotion.init(
      {
        post_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'someone_day_posts',
            key: 'post_id'
          }
        },
        emotion_id: {
          type: DataTypes.TINYINT.UNSIGNED,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'emotions',
            key: 'emotion_id'
          }
        }
      },
      {
        sequelize,
        modelName: 'SomeoneDayEmotion',
        tableName: 'someone_day_emotions',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['post_id']
          },
          {
            fields: ['emotion_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    SomeoneDayPost: typeof SomeoneDayPost;
    Emotion: typeof Emotion;
  }): void {
    SomeoneDayEmotion.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });

    SomeoneDayEmotion.belongsTo(models.Emotion, {
      foreignKey: 'emotion_id',
      as: 'emotion'
    });
  }
}

export default SomeoneDayEmotion;