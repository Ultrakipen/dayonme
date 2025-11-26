import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import MyDayPost from '../models/MyDayPost';

export enum ReportType {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  OTHER = 'other',
  CONTENT = 'content'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

interface MyDayPostReportAttributes {
  report_id?: number;
  post_id: number;
  reporter_id: number;
  report_type: ReportType;
  description: string | null;
  status?: ReportStatus;
  created_at?: Date;
  updated_at?: Date;
}

class MyDayPostReport extends Model<MyDayPostReportAttributes> {
  public report_id?: number;
  public post_id!: number;
  public reporter_id!: number;
  public report_type!: ReportType;
  public description!: string | null;
  public status?: ReportStatus;
  public created_at!: Date;
  public updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = MyDayPostReport.init(
      {
        report_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        post_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'my_day_posts',
            key: 'post_id'
          },
          onDelete: 'CASCADE'
        },
        reporter_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          }
        },
        report_type: {
          type: DataTypes.ENUM(...Object.values(ReportType)),
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ReportStatus)),
          allowNull: false,
          defaultValue: ReportStatus.PENDING
        }
      },
      {
        sequelize,
        modelName: 'MyDayPostReport',
        tableName: 'my_day_post_reports',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['post_id']
          },
          {
            fields: ['reporter_id']
          },
          {
            fields: ['status']
          },
          {
            fields: ['created_at']
          },
          {
            unique: true,
            fields: ['post_id', 'reporter_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    MyDayPost: typeof MyDayPost;
    User: typeof User;
  }): void {
    MyDayPostReport.belongsTo(models.MyDayPost, {
      foreignKey: 'post_id',
      as: 'post'
    });

    MyDayPostReport.belongsTo(models.User, {
      foreignKey: 'reporter_id',
      as: 'reporter'
    });
  }
}

export default MyDayPostReport;