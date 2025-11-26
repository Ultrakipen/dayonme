import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import MyDayComment from '../models/MyDayComment';

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

interface MyDayCommentReportAttributes {
  report_id?: number;
  comment_id: number;
  reporter_id: number;
  report_type: ReportType;
  description: string | null;
  status?: ReportStatus;
  created_at?: Date;
  updated_at?: Date;
}

class MyDayCommentReport extends Model<MyDayCommentReportAttributes> {
  public report_id?: number;
  public comment_id!: number;
  public reporter_id!: number;
  public report_type!: ReportType;
  public description!: string | null;
  public status?: ReportStatus;
  public created_at!: Date;
  public updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = MyDayCommentReport.init(
      {
        report_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        comment_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'my_day_comments',
            key: 'comment_id'
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
        modelName: 'MyDayCommentReport',
        tableName: 'my_day_comment_reports',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['comment_id']
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
            fields: ['comment_id', 'reporter_id']
          }
        ]
      }
    );
    return model;
  }

  public static associate(models: {
    MyDayComment: typeof MyDayComment;
    User: typeof User;
  }): void {
    MyDayCommentReport.belongsTo(models.MyDayComment, {
      foreignKey: 'comment_id',
      as: 'comment'
    });

    MyDayCommentReport.belongsTo(models.User, {
      foreignKey: 'reporter_id',
      as: 'reporter'
    });
  }
}

export default MyDayCommentReport;