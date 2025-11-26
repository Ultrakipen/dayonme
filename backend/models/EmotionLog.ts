// backend/models/EmotionLog.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';
import { Emotion } from './Emotion';

interface EmotionLogAttributes { 
  log_id?: number;
  user_id: number;
  emotion_id: number;
  note: string | null;
  log_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class EmotionLog extends Model<EmotionLogAttributes> {
  public log_id!: number;
  public user_id!: number;
  public emotion_id!: number;
  public note!: string | null;
  public log_date!: Date;

  public static initialize(sequelize: Sequelize) {
    return EmotionLog.init(
      {
        log_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        emotion_id: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          references: {
            model: 'emotions',
            key: 'emotion_id'
          }
        },
        note: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        log_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW 
        }
      },
      {
        sequelize,
        modelName: 'EmotionLog',
        tableName: 'emotion_logs',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['user_id']
          },
          {
            fields: ['emotion_id']
          },
          {
            fields: ['log_date']
          }
        ]
      }
    );
  }

  public static associate(models: {
    User: typeof User;
    Emotion: typeof Emotion;
  }): void {
    EmotionLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    EmotionLog.belongsTo(models.Emotion, {
      foreignKey: 'emotion_id',
      as: 'emotion'
    });
  }
}

export default EmotionLogAttributes;