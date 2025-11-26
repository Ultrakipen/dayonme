// EncouragementMessage.ts
import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize
} from 'sequelize';
import { User } from './User'; // 상대 경로 수정
import { SomeoneDayPostInterface } from './interfaces/SomeoneDayPostInterface';

class EncouragementMessage extends Model <
  InferAttributes<EncouragementMessage>,
  InferCreationAttributes<EncouragementMessage>
> {
  declare message_id: CreationOptional<number>;
  declare sender_id: ForeignKey<number>;
  declare receiver_id: ForeignKey<number>;
  declare post_id: ForeignKey<number>;
  declare message: string;
  declare is_anonymous: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;

  declare sender?: NonAttribute<User>;
  declare receiver?: NonAttribute<User>;
  // any 대신 인터페이스 활용
  declare post?: NonAttribute<SomeoneDayPostInterface>;

  public static initialize(sequelize: Sequelize) {
    const model = EncouragementMessage.init(
      {
        message_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        sender_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        receiver_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        post_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'someone_day_posts',
            key: 'post_id'
          },
          onDelete: 'CASCADE'
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            len: [1, 1000]
          }
        },
        is_anonymous: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'EncouragementMessage',
        tableName: 'encouragement_messages',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
          {
            fields: ['sender_id']
          },
          {
            fields: ['receiver_id']
          },
          {
            fields: ['post_id']
          },
          {
            fields: ['created_at']
          }
        ]
      }
    );
   
    return model;
  }

  public static associate(models: any): void {
    this.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender'
    });

    this.belongsTo(models.User, {
      foreignKey: 'receiver_id',
      as: 'receiver'
    });

    this.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });
  }

  toJSON() {
    const values = super.toJSON();
    if (values && (values as any).is_anonymous) {
      const { sender_id, sender, ...rest } = values as any;
      return rest;
    }
    return values;
  }
}

export { EncouragementMessage };
export default EncouragementMessage;