// models/someoneDayPost.ts
import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute
} from 'sequelize';
import db from '../models';
  
export class SomeoneDayPost extends Model<
InferAttributes<SomeoneDayPost>,
InferCreationAttributes<SomeoneDayPost>
> {
declare post_id: CreationOptional<number>;
declare user_id: ForeignKey<number>;
declare title: string;
declare content: string;
declare summary: CreationOptional<string>;
declare image_url: CreationOptional<string>;
declare is_anonymous: CreationOptional<boolean>;
declare character_count: CreationOptional<number>;
declare like_count: CreationOptional<number>;
declare comment_count: CreationOptional<number>;
declare message_count: CreationOptional<number>;
declare created_at: CreationOptional<Date>;
declare updated_at: CreationOptional<Date>;

// Associations 타입 정의
declare user?: NonAttribute<typeof db.sequelize.models.users>;
declare tags?: NonAttribute<typeof db.sequelize.models.tags[]>;
declare encouragement_messages?: NonAttribute<typeof db.sequelize.models.encouragement_messages[]>;

static initialize(sequelize: Sequelize): typeof SomeoneDayPost {
    SomeoneDayPost.init(
      {
        post_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        title: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            len: [5, 100]
          }
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            len: [20, 2000]
          }
        },
        summary: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        image_url: {
          type: DataTypes.STRING(255),
          allowNull: true
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
        message_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'SomeoneDayPost',
        tableName: 'someone_day_posts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        indexes: [
          {
            fields: ['user_id']
          },
          {
            fields: ['created_at']
          }
        ]
      }
    );
    return SomeoneDayPost;
  }

  static associate(models: typeof db.sequelize.models): void {
    this.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      targetKey: 'user_id'
    });

    this.hasMany(models.encouragement_messages, {
      foreignKey: 'post_id',
      as: 'encouragement_messages',
      sourceKey: 'post_id'
    });

    this.belongsToMany(models.tags, {
      through: 'someone_day_tags',
      foreignKey: 'post_id',
      otherKey: 'tag_id',
      as: 'tags'
    });
  }
}

export default SomeoneDayPost;