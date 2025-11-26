import { Model, DataTypes, Sequelize } from 'sequelize';
import { User } from './User';
import Challenge from './Challenge';

export enum ReportType {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  VIOLENCE = 'violence',
  MISINFORMATION = 'misinformation',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

interface ChallengeReportAttributes {
  report_id?: number;
  challenge_id: number;
  reporter_id: number;
  report_type: ReportType;
  description: string | null;
  status: ReportStatus;
}

class ChallengeReport extends Model<ChallengeReportAttributes> {
  public report_id?: number;
  public challenge_id!: number;
  public reporter_id!: number;
  public report_type!: ReportType;
  public description!: string | null;
  public status!: ReportStatus;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    const model = ChallengeReport.init(
      {
        report_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        challenge_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'challenge_id'
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
        modelName: 'ChallengeReport',
        tableName: 'challenge_reports',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['challenge_id'] },
          { fields: ['reporter_id'] },
          { fields: ['status'] },
          { fields: ['created_at'] }
        ]
      }
    );
    return model;
  }

  public static associate(models: any): void {
    ChallengeReport.belongsTo(models.Challenge, {
      foreignKey: 'challenge_id',
      as: 'challenge'
    });

    ChallengeReport.belongsTo(models.User, {
      foreignKey: 'reporter_id',
      as: 'reporter'
    });
  }
}

export default ChallengeReport;
