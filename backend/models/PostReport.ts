import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from '../models/User';
import  SomeoneDayPost  from '../models/SomeoneDayPost';

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

interface PostReportAttributes {
  report_id?: number; // report_id를 선택적으로 변경
  post_id: number;
  reporter_id: number;
  report_type: ReportType;
  description: string | null;
  status: ReportStatus;
 }

 class PostReport extends Model<PostReportAttributes> {
  public report_id?: number; // 속성 정의도 선택적으로 변경
  public post_id!: number;
  public reporter_id!: number;
  public report_type!: ReportType;
  public description!: string | null;
  public status!: ReportStatus;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = PostReport.init(
      {
        report_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: true // allowNull 추가
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
       modelName: 'PostReport',
       tableName: 'post_reports',
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
         }
       ]
     }
   );
   return model;
 }

 public static associate(models: {
   SomeoneDayPost: typeof SomeoneDayPost;
   User: typeof User;
 }): void {
   PostReport.belongsTo(models.SomeoneDayPost, {
     foreignKey: 'post_id',
     as: 'post'
   });

   PostReport.belongsTo(models.User, {
     foreignKey: 'reporter_id',
     as: 'reporter'
   });
 }
}

export default PostReport;