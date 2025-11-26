// models/Notice.ts - 공지사항 모델
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface NoticeAttributes {
  notice_id: number;
  title: string;
  content: string;
  type: 'normal' | 'important' | 'maintenance';
  is_pinned: boolean;
  is_active: boolean;
  view_count: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface NoticeCreationAttributes extends Optional<NoticeAttributes, 'notice_id' | 'type' | 'is_pinned' | 'is_active' | 'view_count' | 'created_at' | 'updated_at'> {}

class Notice extends Model<NoticeAttributes, NoticeCreationAttributes> implements NoticeAttributes {
  public notice_id!: number;
  public title!: string;
  public content!: string;
  public type!: 'normal' | 'important' | 'maintenance';
  public is_pinned!: boolean;
  public is_active!: boolean;
  public view_count!: number;
  public created_by!: number;
  public created_at!: Date;
  public updated_at!: Date;

  public static initialize(sequelize: Sequelize): typeof Notice {
    Notice.init(
      {
        notice_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false,
          validate: { len: [1, 200] },
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM('normal', 'important', 'maintenance'),
          defaultValue: 'normal',
        },
        is_pinned: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        view_count: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        created_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'notices',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { fields: ['is_active', 'is_pinned'] },
          { fields: ['created_at'] },
        ],
      }
    );
    return Notice;
  }
}

export default Notice;
