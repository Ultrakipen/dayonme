import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import SomeoneDayPost from '../models/SomeoneDayPost';
interface SomeoneDayLikeAttributes {
id: number;
post_id: number;
user_id: number;
}

interface SomeoneDayLikeCreationAttributes {
post_id: number;
user_id: number;
}
class SomeoneDayLike extends Model<SomeoneDayLikeAttributes, SomeoneDayLikeCreationAttributes> {
public id!: number;
public post_id!: number;
public user_id!: number;
public static initialize(sequelize: Sequelize) {
const model = SomeoneDayLike.init(
{
id: {
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
user_id: {
type: DataTypes.INTEGER,
allowNull: false,
references: {
model: 'users',
key: 'user_id'
}
}
},
{
sequelize,
modelName: 'SomeoneDayLike',
tableName: 'someone_day_likes',
timestamps: true,
underscored: true,
indexes: [
{
unique: true,
fields: ['post_id', 'user_id']
}
]
}
);
return model;
}
public static associate(models: {
User: typeof User;
SomeoneDayPost: typeof SomeoneDayPost;
}): void {
SomeoneDayLike.belongsTo(models.User, {
foreignKey: 'user_id',
as: 'user'
});
SomeoneDayLike.belongsTo(models.SomeoneDayPost, {
  foreignKey: 'post_id',
  as: 'post'
});
}
}
export default SomeoneDayLike;