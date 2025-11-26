'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Users 테이블
      await queryInterface.createTable('users', {
        user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        username: {
          type: Sequelize.STRING(50),
          unique: true,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(100),
          unique: true,
          allowNull: false
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        nickname: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        profile_image: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        bio: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        last_login: {
          type: Sequelize.DATE,
          allowNull: true
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        reset_token: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        reset_token_expires: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // 2. Emotions 테이블
      await queryInterface.createTable('emotions', {
        emotion_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        color: {
          type: Sequelize.STRING(7),
          allowNull: false
        },
        icon: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // 3. Tags 테이블
      await queryInterface.createTable('tags', {
        tag_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        color: {
          type: Sequelize.STRING(7),
          allowNull: true
        },
        usage_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // 4. MyDay Posts 테이블
      await queryInterface.createTable('my_day_posts', {
        post_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        image_url: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        emotion_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'emotions',
            key: 'emotion_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        is_anonymous: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        like_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        comment_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // 5. SomeoneDay Posts 테이블
      await queryInterface.createTable('someone_day_posts', {
        post_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        image_url: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        emotion_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'emotions',
            key: 'emotion_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        is_anonymous: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        like_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        comment_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        view_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // 6. Challenges 테이블
      await queryInterface.createTable('challenges', {
        challenge_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        creator_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        max_participants: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        current_participants: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        is_public: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        status: {
          type: Sequelize.ENUM('pending', 'active', 'completed', 'cancelled'),
          defaultValue: 'pending'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // 7. 연결 테이블들 생성
      
      // MyDay Comments
      await queryInterface.createTable('my_day_comments', {
        comment_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        post_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'my_day_posts',
            key: 'post_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // SomeoneDay Comments
      await queryInterface.createTable('someone_day_comments', {
        comment_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        post_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'someone_day_posts',
            key: 'post_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        is_anonymous: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        like_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // Challenge Participants
      await queryInterface.createTable('challenge_participants', {
        participant_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        challenge_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'challenge_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        joined_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        status: {
          type: Sequelize.ENUM('active', 'completed', 'dropped'),
          defaultValue: 'active'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // Challenge Emotions
      await queryInterface.createTable('challenge_emotions', {
        log_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        challenge_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'challenge_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        emotion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'emotions',
            key: 'emotion_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        log_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // Content Blocks 테이블 (콘텐츠 차단)
      await queryInterface.createTable('content_blocks', {
        block_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        content_type: {
          type: Sequelize.ENUM('post', 'comment'),
          allowNull: false
        },
        content_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        reason: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // User Blocks 테이블 (사용자 차단)
      await queryInterface.createTable('user_blocks', {
        block_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        blocked_user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        reason: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      });

      // 기본 인덱스 생성
      await queryInterface.addIndex('users', ['email'], { transaction });
      await queryInterface.addIndex('users', ['username'], { transaction });
      await queryInterface.addIndex('my_day_posts', ['user_id'], { transaction });
      await queryInterface.addIndex('my_day_posts', ['created_at'], { transaction });
      await queryInterface.addIndex('someone_day_posts', ['user_id'], { transaction });
      await queryInterface.addIndex('someone_day_posts', ['created_at'], { transaction });
      await queryInterface.addIndex('challenges', ['creator_id'], { transaction });
      await queryInterface.addIndex('challenges', ['status'], { transaction });
      await queryInterface.addIndex('challenge_participants', ['challenge_id', 'user_id'], { 
        unique: true, 
        transaction 
      });
      await queryInterface.addIndex('challenge_emotions', ['challenge_id', 'user_id', 'log_date'], {
        unique: true,
        transaction
      });

      // Block 테이블 인덱스
      await queryInterface.addIndex('content_blocks', ['user_id', 'content_type', 'content_id'], {
        unique: true,
        transaction
      });
      await queryInterface.addIndex('user_blocks', ['user_id', 'blocked_user_id'], {
        unique: true,
        transaction
      });

      console.log('✅ 데이터베이스 초기 스키마 생성 완료');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 역순으로 테이블 삭제
      const tables = [
        'content_blocks',
        'user_blocks',
        'challenge_emotions',
        'challenge_participants',
        'someone_day_comments',
        'my_day_comments',
        'challenges',
        'someone_day_posts',
        'my_day_posts',
        'tags',
        'emotions',
        'users'
      ];

      for (const table of tables) {
        await queryInterface.dropTable(table, { transaction });
      }

      console.log('✅ 데이터베이스 초기 스키마 롤백 완료');
    });
  }
};