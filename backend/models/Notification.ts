import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey
} from 'sequelize';
import { User } from '../models/User';

interface NotificationAttributes {
  notification_id: number;
  user_id: number;
  notification_type: 'encouragement' | 'comment' | 'reply' | 'reaction' | 'challenge';
  related_id?: number;
  post_id?: number;
  post_type?: string;
  sender_id?: number;
  sender_nickname?: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: Date;
}

class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare notification_id: CreationOptional<number>;
  declare user_id: ForeignKey<number>;
  declare notification_type: 'encouragement' | 'comment' | 'reply' | 'reaction' | 'challenge';
  declare related_id: CreationOptional<number>;
  declare post_id: CreationOptional<number>;
  declare post_type: CreationOptional<string>;
  declare sender_id: CreationOptional<number>;
  declare sender_nickname: CreationOptional<string>;
  declare title: string;
  declare message: string;
  declare is_read: CreationOptional<boolean>;
  declare read_at: CreationOptional<Date>;
  declare readonly created_at: CreationOptional<Date>;
  
  public static initialize(sequelize: Sequelize) {
    const model = Notification.init(
      {
        notification_id: {
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
        notification_type: {
          type: DataTypes.ENUM('encouragement', 'comment', 'reply', 'reaction', 'challenge'),
          allowNull: false
        },
        related_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        post_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        post_type: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        sender_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        sender_nickname: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        read_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
          {
            fields: ['user_id', 'is_read', 'created_at']
          },
          {
            fields: ['notification_type']
          }
        ]
      }
    );
    return model;
  }
  public static associate(models: {
  User: typeof User;
  }): void {
  Notification.belongsTo(models.User, {
  foreignKey: 'user_id',
  as: 'user'
  });
  }
  }
  export default Notification;