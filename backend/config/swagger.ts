import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dayonme API',
      version: '1.0.0',
      description: 'Dayonme API Documentation',
    },
    servers: [
      {
        url: `http://localhost:3000/api`,
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // 기존 스키마들 유지...

        // 새로 추가할 스키마들
        Emotion: {
          type: 'object',
          required: ['name', 'icon'],
          properties: {
            emotion_id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              maxLength: 50,
              example: '행복'
            },
            icon: {
              type: 'string',
              maxLength: 50,
              example: '😊'
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              example: '#FFD700'
            }
          }
        },
        EmotionLog: {
          type: 'object',
          required: ['user_id', 'emotion_id', 'log_date'],
          properties: {
            log_id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            emotion_id: {
              type: 'integer',
              example: 1
            },
            note: {
              type: 'string',
              maxLength: 200,
              example: '오늘은 특별히 행복했던 이유...'
            },
            log_date: {
              type: 'string',
              format: 'date',
              example: '2024-03-01'
            }
          }
        },
        MyDayComment: {
          type: 'object',
          required: ['post_id', 'user_id', 'content'],
          properties: {
            comment_id: {
              type: 'integer',
              example: 1
            },
            post_id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            content: {
              type: 'string',
              maxLength: 500,
              example: '공감합니다. 힘내세요!'
            },
            is_anonymous: {
              type: 'boolean',
              default: false
            }
          }
        },
        ChallengeParticipant: {
          type: 'object',
          required: ['challenge_id', 'user_id'],
          properties: {
            challenge_id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            joined_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Tag: {
          type: 'object',
          required: ['name'],
          properties: {
            tag_id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              maxLength: 50,
              example: '위로'
            }
          }
        },
        UserStats: {
          type: 'object',
          properties: {
            user_id: {
              type: 'integer',
              example: 1
            },
            my_day_post_count: {
              type: 'integer',
              default: 0
            },
            someone_day_post_count: {
              type: 'integer',
              default: 0
            },
            my_day_like_received_count: {
              type: 'integer',
              default: 0
            },
            someone_day_like_received_count: {
              type: 'integer',
              default: 0
            },
            challenge_count: {
              type: 'integer',
              default: 0
            },
            last_updated: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Notification: {
          type: 'object',
          required: ['user_id', 'content', 'notification_type'],
          properties: {
            notification_id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            content: {
              type: 'string',
              maxLength: 255,
              example: '새로운 댓글이 달렸습니다.'
            },
            notification_type: {
              type: 'string',
              enum: ['like', 'comment', 'challenge', 'system']
            },
            is_read: {
              type: 'boolean',
              default: false
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export default specs;