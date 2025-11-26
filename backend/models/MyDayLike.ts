// backend/models/MyDayLike.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import MyDayPost from '../models/MyDayPost';

interface MyDayLikeAttributes {
 user_id: number;
 post_id: number;
 created_at?: Date;
 updated_at?: Date;
}

class MyDayLike extends Model<MyDayLikeAttributes> {
 public user_id!: number;
 public post_id!: number;
 public created_at!: Date;
 public updated_at!: Date;

 public static initialize(sequelize: Sequelize): typeof MyDayLike {
   const model = MyDayLike.init(
     {
       user_id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         allowNull: false,
         references: {
           model: 'users',
           key: 'user_id'
         }
       },
       post_id: {
         type: DataTypes.INTEGER,
         primaryKey: true, 
         allowNull: false,
         references: {
           model: 'my_day_posts',
           key: 'post_id'
         }
       }
     },
     {
       sequelize,
       modelName: 'MyDayLike',
       tableName: 'my_day_likes',
       timestamps: true,
       underscored: true,
       indexes: [
         {
           fields: ['post_id']
         },
         {
           fields: ['user_id']
         }
       ]
     }
   );
   return model;
 }

 public static associate(models: {
   User: typeof User;
   MyDayPost: typeof MyDayPost; 
 }): void {
   MyDayLike.belongsTo(models.User, {
     foreignKey: 'user_id',
     as: 'user'
   });

   MyDayLike.belongsTo(models.MyDayPost, {
     foreignKey: 'post_id',
     as: 'post'
   });
 }
}

export default MyDayLike;