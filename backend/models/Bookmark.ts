// backend/models/Bookmark.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';

interface BookmarkAttributes {
  bookmark_id?: number;
  user_id: number;
  post_id: number;
  post_type: 'my_day' | 'comfort_wall';
  created_at?: Date;
}

class Bookmark extends Model<BookmarkAttributes> {
  public bookmark_id!: number;
  public user_id!: number;
  public post_id!: number;
  public post_type!: 'my_day' | 'comfort_wall';
  public created_at!: Date;

  public static initialize(sequelize: Sequelize): typeof Bookmark {
    const model = Bookmark.init(
      {
        bookmark_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onDelete: 'CASCADE'
        },
        post_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        post_type: {
          type: DataTypes.ENUM('my_day', 'comfort_wall'),
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'Bookmark',
        tableName: 'bookmarks',
        timestamps: false,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['user_id', 'post_id', 'post_type']
          },
          {
            fields: ['user_id']
          },
          {
            fields: ['post_id']
          },
          {
            fields: ['post_type']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    User: typeof User;
  }): void {
    Bookmark.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

export default Bookmark;
