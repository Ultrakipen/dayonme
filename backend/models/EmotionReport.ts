// models/EmotionReport.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface EmotionDistribution {
  emotion_id: number;
  emotion_name: string;
  icon: string;
  count: number;
  percentage: number;
}

interface WeeklyPattern {
  day: number;
  day_name: string;
  count: number;
  primary_emotion?: string;
}

interface EmotionReportAttributes {
  report_id?: number;
  user_id: number;
  report_type: 'weekly' | 'monthly';
  report_period: string;
  total_logs: number;
  active_days: number;
  challenge_participations: number;
  challenges_completed: number;
  emotion_distribution: EmotionDistribution[] | null;
  top_emotions: string[] | null;
  emotion_trend: string | null;
  weekly_pattern: WeeklyPattern[] | null;
  encouragements_sent: number;
  encouragements_received: number;
  ai_insight: string | null;
  ai_recommendations: string[] | null;
  generated_at: Date;
  is_viewed: boolean;
  viewed_at?: Date | null;
}

class EmotionReport extends Model<EmotionReportAttributes> {
  public report_id!: number;
  public user_id!: number;
  public report_type!: 'weekly' | 'monthly';
  public report_period!: string;
  public total_logs!: number;
  public active_days!: number;
  public challenge_participations!: number;
  public challenges_completed!: number;
  public emotion_distribution!: EmotionDistribution[] | null;
  public top_emotions!: string[] | null;
  public emotion_trend!: string | null;
  public weekly_pattern!: WeeklyPattern[] | null;
  public encouragements_sent!: number;
  public encouragements_received!: number;
  public ai_insight!: string | null;
  public ai_recommendations!: string[] | null;
  public generated_at!: Date;
  public is_viewed!: boolean;
  public viewed_at!: Date | null;

  public static initialize(sequelize: Sequelize) {
    return EmotionReport.init(
      {
        report_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        report_type: {
          type: DataTypes.ENUM('weekly', 'monthly'),
          allowNull: false,
          defaultValue: 'monthly',
        },
        report_period: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        total_logs: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        active_days: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        challenge_participations: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        challenges_completed: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        emotion_distribution: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        top_emotions: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        emotion_trend: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        weekly_pattern: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        encouragements_sent: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        encouragements_received: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        ai_insight: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        ai_recommendations: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        generated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        is_viewed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        viewed_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'emotion_reports',
        timestamps: false,
        indexes: [
          { fields: ['user_id', 'report_type'] },
          { fields: ['generated_at'] },
        ],
      }
    );
  }

  public static associate(models: any): void {
    EmotionReport.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

export type { EmotionReportAttributes, EmotionDistribution, WeeklyPattern };
export default EmotionReport;
