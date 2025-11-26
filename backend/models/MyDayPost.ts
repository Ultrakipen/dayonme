// models/MyDayPost.ts

import { Model, DataTypes, Sequelize } from 'sequelize';

interface MyDayPostAttributes {
post_id?: number;
user_id: number;
content: string;
emotion_summary?: string;
image_url?: string;
is_anonymous: boolean;
character_count?: number;
like_count: number;
comment_count: number;
reaction_count?: number;
created_at?: Date;
updated_at?: Date;
}

interface MyDayPostCreationAttributes extends Omit<MyDayPostAttributes, 'post_id'> {
post_id?: number;
}

class MyDayPost extends Model<MyDayPostAttributes, MyDayPostCreationAttributes> {
declare post_id: number;
declare user_id: number;
declare content: string;
declare emotion_summary?: string;
declare image_url?: string;
declare is_anonymous: boolean;
declare character_count?: number;
declare like_count: number;
declare comment_count: number;
declare reaction_count?: number;
declare readonly created_at: Date;
declare readonly updated_at: Date;

public static associate(models: any): void {
 MyDayPost.belongsTo(models.User, {
   foreignKey: 'user_id',
   as: 'user'
 });

 MyDayPost.belongsToMany(models.Emotion, {
   through: models.MyDayEmotion,
   foreignKey: 'post_id',
   otherKey: 'emotion_id',
   as: 'emotions',
   onDelete: 'CASCADE'
 });

 MyDayPost.hasMany(models.MyDayComment, {
   foreignKey: 'post_id',
   as: 'comments',
   onDelete: 'CASCADE'
 });

 MyDayPost.hasMany(models.MyDayLike, {
   foreignKey: 'post_id',
   as: 'likes',
   onDelete: 'CASCADE'
 });
}

// models/MyDayPost.ts 파일 수정

static initialize(sequelize: Sequelize): typeof MyDayPost {
  return MyDayPost.init(
    {
      post_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
        type: DataTypes.TEXT,
        allowNull: false
      },
      emotion_summary: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null  
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      character_count: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: true
      },
      like_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      comment_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reaction_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'MyDayPost',
      tableName: 'my_day_posts',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['user_id', 'created_at'] },
        { fields: ['created_at'] },
        { fields: ['is_anonymous'] }
      ],
      hooks: {
        beforeDestroy: async (instance: MyDayPost, options) => {
          try {
            const { MyDayEmotion, MyDayLike, MyDayComment } = sequelize.models;
            
            // 개별적으로 삭제하고 각 단계에서 오류를 처리
            try {
              await MyDayEmotion.destroy({
                where: { post_id: instance.post_id },
                transaction: options.transaction
              });
            } catch (error) {
              console.log(`MyDayEmotion 삭제 오류 무시 (post_id: ${instance.post_id}):`, error);
            }
            
            try {
              await MyDayLike.destroy({ 
                where: { post_id: instance.post_id },
                transaction: options.transaction
              });
            } catch (error) {
              console.log(`MyDayLike 삭제 오류 무시 (post_id: ${instance.post_id}):`, error);
            }
            
            try {
              await MyDayComment.destroy({
                where: { post_id: instance.post_id },
                transaction: options.transaction
              });
            } catch (error) {
              console.log(`MyDayComment 삭제 오류 무시 (post_id: ${instance.post_id}):`, error);
            }
          } catch (error) {
            console.error('beforeDestroy hook 오류:', error);
            // hook에서 오류가 발생해도 삭제는 계속 진행
          }
        }
      }
    }
  );
}
}

export default MyDayPost;