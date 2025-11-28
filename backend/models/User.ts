import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export type ThemePreference = 'light' | 'dark' | 'system';
export type UserRole = 'user' | 'admin';

interface UserAttributes {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  nickname?: string;
  profile_image_url?: string;
  background_image_url?: string;
  favorite_quote?: string;
  theme_preference?: ThemePreference;
  privacy_settings?: JSON;
  is_active: boolean;
  role: UserRole;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
  notification_settings: {
    like_notifications: boolean;
    comment_notifications: boolean;
    challenge_notifications: boolean;
    encouragement_notifications: boolean;
    quiet_hours_start?: string; // 방해 금지 시작 시간 (HH:mm 형식)
    quiet_hours_end?: string; // 방해 금지 종료 시간 (HH:mm 형식)
    daily_reminder?: string; // 일일 리마인더 시간 (HH:mm 형식)
  };
  reset_token?: string; // 추가: 비밀번호 재설정 토큰
  reset_token_expires?: Date; // 추가: 비밀번호 재설정 토큰 만료일
  is_email_verified: boolean; // 추가: 이메일 인증 여부
  email_verification_code?: string; // 추가: 이메일 인증 코드 (6자리)
  email_verification_expires?: Date; // 추가: 이메일 인증 코드 만료 시간
}

// created_at, updated_at, notification_settings도 선택사항으로 만들기
interface UserCreationAttributes extends Optional<UserAttributes,
  'user_id' | 'created_at' | 'updated_at' | 'notification_settings' | 'role' |
  'nickname' | 'profile_image_url' | 'background_image_url' | 'favorite_quote' |
  'theme_preference' | 'privacy_settings' | 'last_login_at' | 'reset_token' | 'reset_token_expires' |
  'email_verification_code' | 'email_verification_expires'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> {
  public user_id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public nickname?: string;
  public profile_image_url?: string;
  public background_image_url?: string;
  public favorite_quote?: string;
  public theme_preference?: ThemePreference;
  public privacy_settings?: JSON;
  public is_active!: boolean;
  public role!: UserRole;
  public last_login_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;
  public notification_settings!: {
    like_notifications: boolean;
    comment_notifications: boolean;
    challenge_notifications: boolean;
    encouragement_notifications: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    daily_reminder?: string;
  };
  public reset_token?: string; // 추가: 비밀번호 재설정 토큰
  public reset_token_expires?: Date; // 추가: 비밀번호 재설정 토큰 만료일
  public is_email_verified!: boolean; // 추가: 이메일 인증 여부
  public email_verification_code?: string; // 추가: 이메일 인증 코드
  public email_verification_expires?: Date; // 추가: 이메일 인증 코드 만료 시간


  public static initialize(sequelize: Sequelize): typeof User {
    const userModel = User.init(
      {
        user_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          field: 'user_id'
        },
        username: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [2, 50]
          }
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        password_hash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        nickname: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        profile_image_url: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        background_image_url: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        favorite_quote: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        theme_preference: {
          type: DataTypes.ENUM('light', 'dark', 'system'),
          allowNull: true,
          defaultValue: 'system'
        },
        privacy_settings: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {} // 빈 객체로 기본값 설정
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        role: {
          type: DataTypes.ENUM('user', 'admin'),
          allowNull: false,
          defaultValue: 'user'
        },
        last_login_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null
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
        },
        notification_settings: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            like_notifications: true,
            comment_notifications: true,
            challenge_notifications: true,
            encouragement_notifications: true,
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00',
            daily_reminder: '20:00'
          }
        },
        reset_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: null
        },
        reset_token_expires: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null
        },
        is_email_verified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        email_verification_code: {
          type: DataTypes.STRING(6),
          allowNull: true,
          defaultValue: null
        },
        email_verification_expires: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null
        }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        underscored: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
          { fields: ['email'], unique: true },
          { fields: ['username'], unique: true },
          { fields: ['is_active', 'created_at'] },
          { fields: ['created_at'] },
          { fields: ['reset_token'] }
        ]
      }
    );
    return userModel;
  }

  // 중복된 associate 메서드 중 하나만 남김
  public static associate(models: any): void {
    User.hasMany(models.MyDayPost, {
      foreignKey: 'user_id',
      as: 'my_day_posts'
    });
  }
}

export type { UserAttributes, UserCreationAttributes };
export default User;