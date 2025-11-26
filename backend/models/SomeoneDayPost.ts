import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from '../models/User';
// Tag와 EncouragementMessage 직접 임포트 제거

interface SomeoneDayPostAttributes {
 post_id?: number;
 user_id: number;
 title: string;
 content: string;
 summary?: string;
 image_url?: string | null;
 is_anonymous: boolean;
 character_count?: number;
 like_count: number;
 comment_count: number;
 reaction_count?: number;

 created_at?: Date;
 updated_at?: Date;
 user?: {
   nickname: string;
   profile_image_url?: string;
 };
 tags?: Array<{
   tag_id: number;
   name: string;
 }>;
}

class SomeoneDayPost extends Model<SomeoneDayPostAttributes> {
 public post_id!: number;
 public user_id!: number;
 public title!: string;
 public content!: string;
 public summary?: string;
 public image_url?: string | null;
 public is_anonymous!: boolean;
 public character_count?: number;
 public like_count!: number;
 public comment_count!: number;
 public reaction_count?: number;

 static async findById(id: number) {
  return this.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['nickname', 'profile_image_url']
      }
      // Tag 모델은 실제 사용 시점에서 동적으로 조회
    ]
  });
}

public static initialize(sequelize: Sequelize) {
  const model = SomeoneDayPost.init(
    {
      post_id: {
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
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [5, 100]
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [20, 2000]
        }
      },
      summary: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      character_count: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      like_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      comment_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reaction_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    },
    {
      sequelize,
      modelName: 'SomeoneDayPost',
      tableName: 'someone_day_posts',
      timestamps: true, // 자동 타임스탬프 활성화
      paranoid: false, // 소프트 삭제 비활성화 (deleted_at 컬럼 미사용)
      underscored: true,
      indexes: [
        // 단일 인덱스
        {
          fields: ['user_id']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['like_count']
        },
        {
          fields: ['is_anonymous']
        },
        // 복합 인덱스 (성능 최적화)
        {
          name: 'idx_created_like',
          fields: [
            { name: 'created_at', order: 'DESC' },
            { name: 'like_count', order: 'DESC' }
          ]
        },
        {
          name: 'idx_user_created',
          fields: [
            'user_id',
            { name: 'created_at', order: 'DESC' }
          ]
        },
        {
          name: 'idx_like_comment',
          fields: [
            { name: 'like_count', order: 'DESC' },
            { name: 'comment_count', order: 'DESC' }
          ]
        }
      ]
    }
  );
  return model;
}

public static associate(models: any): void {
  SomeoneDayPost.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  SomeoneDayPost.belongsToMany(models.Tag, {
    through: models.SomeoneDayTag,
    foreignKey: 'post_id',
    otherKey: 'tag_id',
    as: 'tags'
  });
 
  SomeoneDayPost.hasMany(models.EncouragementMessage, {
    foreignKey: 'post_id',
    as: 'encouragement_messages'
  });

  // 댓글 관계 추가
  SomeoneDayPost.hasMany(models.SomeoneDayComment, {
    foreignKey: 'post_id',
    as: 'comments'
  });

  // 감정 관계 추가 (다대다 관계)
  SomeoneDayPost.belongsToMany(models.Emotion, {
    through: models.SomeoneDayEmotion, // 중간 테이블명
    foreignKey: 'post_id',
    otherKey: 'emotion_id',
    as: 'emotions'
  });
}
}

export default SomeoneDayPost;