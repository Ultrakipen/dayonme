import { Model, DataTypes, Sequelize } from 'sequelize';
import  SomeoneDayPost from '../models/SomeoneDayPost';
import  Tag  from '../models/Tag';

interface PostTagAttributes {
 post_id: number;
 tag_id: number;
}

class PostTag extends Model<PostTagAttributes> {
 public post_id!: number;
 public tag_id!: number;

 public static initialize(sequelize: Sequelize) {
   const model = PostTag.init(
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
       tag_id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         allowNull: false,
         references: {
           model: 'tags',
           key: 'tag_id'
         }
       }
     },
     {
       sequelize,
       modelName: 'PostTag',
       tableName: 'post_tags',
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
   PostTag.belongsTo(models.SomeoneDayPost, {
     foreignKey: 'post_id',
     as: 'post'
   });

   PostTag.belongsTo(models.Tag, {
     foreignKey: 'tag_id',
     as: 'tag'
   });
 }
}

export default PostTag;