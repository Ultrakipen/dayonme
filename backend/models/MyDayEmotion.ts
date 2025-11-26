// backend/models/MyDayEmotion.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import MyDayPost from '../models/MyDayPost';
import { Emotion } from '../models/Emotion';

interface MyDayEmotionAttributes {
  post_id: number;
  emotion_id: number;
}

class MyDayEmotion extends Model<MyDayEmotionAttributes> {
  public post_id!: number;
  public emotion_id!: number;

  public static initialize(sequelize: Sequelize) {
    const model = MyDayEmotion.init(
      {
        post_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'my_day_posts',
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
        modelName: 'MyDayEmotion',
        tableName: 'my_day_emotions',
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
    MyDayPost: typeof MyDayPost;
    Emotion: typeof Emotion;
  }): void {
    MyDayEmotion.belongsTo(models.MyDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });

    MyDayEmotion.belongsTo(models.Emotion, {
      foreignKey: 'emotion_id',
      as: 'emotion'
    });
  }
}

export default MyDayEmotion;