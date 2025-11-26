// controllers/userController.ts - 실제 서비스용 사용자 컨트롤러
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import db from '../models';
import { AuthRequest } from '../types/express';
import { config } from '../config/environment';
import { CryptoUtils } from '../utils/crypto';

class UserController {
  
  // 회원가입
  async register(req: Request, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const { username, email, password, nickname } = req.body;
    
      // 기본 유효성 검사
      if (!username || !email || !password) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '사용자명, 이메일, 비밀번호는 필수 항목입니다.'
        });
      }

      if (password.length < 6) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '비밀번호는 최소 6자 이상이어야 합니다.'
        });
      }
        
      // 중복 확인
      const existingUser = await db.User.findOne({
        where: {
          [Op.or]: [
            { email: email.toLowerCase() },
            { username }
          ]
        },
        transaction
      });
        
      if (existingUser) {
        await transaction.rollback();
        return res.status(409).json({
          status: 'error',
          message: '이미 존재하는 이메일 또는 사용자명입니다.'
        });
      }
    
      // 비밀번호 해싱
      const passwordHash = await CryptoUtils.hashPassword(password);
        
      // 사용자 생성 (Sequelize JSON 타입은 객체를 직접 저장)
      const user = await db.User.create({
        username,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        nickname: nickname || username,
        theme_preference: 'system',
        is_active: true,
        notification_settings: {
          like_notifications: true,
          comment_notifications: true,
          challenge_notifications: true,
          encouragement_notifications: true
        } as any,
        privacy_settings: {} as any
      } as any, { transaction });
    
      // JWT 토큰 생성
      const token = jwt.sign(
        { user_id: user.get('user_id') }, 
        config.security.jwtSecret as string,
        { expiresIn: config.security.jwtExpiresIn } as any
      );
        
      await transaction.commit();
        
      return res.status(201).json({
        status: 'success',
        message: '회원가입이 완료되었습니다.',
        data: {
          token,
          user: {
            user_id: user.get('user_id'),
            username: user.get('username'),
            email: user.get('email'),
            nickname: user.get('nickname')
          }
        }
      });
      
    } catch (error: any) {
      await transaction.rollback();
      console.error('회원가입 오류:', error);
      return res.status(500).json({
        status: 'error', 
        message: '회원가입 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // 로그인
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: '이메일과 비밀번호를 모두 입력해주세요.'
        });
      }

      const user = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      if (!user.get('is_active')) {
        return res.status(403).json({
          status: 'error',
          message: '비활성화된 계정입니다.'
        });
      }

      const isPasswordValid = await CryptoUtils.verifyPassword(password, user.get('password_hash') as string);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { user_id: user.get('user_id') }, 
        config.security.jwtSecret as string,
        { expiresIn: config.security.jwtExpiresIn } as any
      );

      // 마지막 로그인 시간 업데이트 (오류 무시)
      try {
        await user.update({ last_login_at: new Date() });
      } catch (updateError) {
        // 무시
      }

      return res.json({
        status: 'success',
        message: '로그인이 완료되었습니다.',
        data: {
          token,
          user: {
            user_id: user.get('user_id'),
            username: user.get('username'),
            email: user.get('email'),
            nickname: user.get('nickname'),
            theme_preference: user.get('theme_preference'),
            profile_image_url: user.get('profile_image_url')
          }
        }
      });

    } catch (error: any) {
      console.error('로그인 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '로그인 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // 로그아웃
  async logout(req: AuthRequest, res: Response) {
    try {
      return res.json({
        status: 'success',
        message: '로그아웃이 완료되었습니다.'
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: '로그아웃 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // 프로필 조회
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const user = await db.User.findByPk(userId, {
        attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires', 'email_verification_code'] }
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      const userData: any = user.toJSON();

      // 프로필 이미지 URL 처리 - 상대 경로를 절대 URL로 변환 (클라이언트가 사용한 호스트 사용)
      if (userData.profile_image_url) {
        // 이미 완전한 URL인 경우 (http:// 또는 https://로 시작)
        if (!userData.profile_image_url.startsWith('http://') && !userData.profile_image_url.startsWith('https://')) {
          // 상대 경로인 경우 절대 URL로 변환
          if (userData.profile_image_url.startsWith('/uploads/')) {
            const protocol = req.protocol; // http or https
            const host = req.get('host'); // 192.168.219.51:3001 또는 localhost:3001
            userData.profile_image_url = `${protocol}://${host}${userData.profile_image_url}`;
          }
        }
      }

      return res.json({
        status: 'success',
        data: userData
      });

    } catch (error: any) {
      console.error('프로필 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '프로필 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 프로필 업데이트
  async updateProfile(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const userId = req.user?.user_id;
      const { nickname, bio, profile_image_url, background_image_url, favorite_quote, theme_preference } = req.body;

      console.log('🔍 [updateProfile] 요청 데이터:', {
        userId,
        nickname,
        bio,
        profile_image_url,
        background_image_url,
        favorite_quote,
        theme_preference
      });

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const user = await db.User.findByPk(userId, { transaction });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 닉네임 중복 확인 (자신 제외)
      if (nickname && nickname !== user.get('nickname')) {
        const existingUser = await db.User.findOne({
          where: {
            nickname: nickname.trim(),
            user_id: { [Op.ne]: userId }
          },
          transaction
        });

        if (existingUser) {
          await transaction.rollback();
          return res.status(409).json({
            status: 'error',
            message: '이미 사용 중인 닉네임입니다.'
          });
        }
      }

      // 업데이트할 데이터 준비
      const updateData: any = {};
      if (nickname !== undefined) updateData.nickname = nickname.trim();
      if (bio !== undefined) updateData.bio = bio;
      if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;
      if (background_image_url !== undefined) updateData.background_image_url = background_image_url;
      if (favorite_quote !== undefined) updateData.favorite_quote = favorite_quote;
      if (theme_preference !== undefined && ['light', 'dark', 'system'].includes(theme_preference)) {
        updateData.theme_preference = theme_preference;
      }

      console.log('💾 [updateProfile] 업데이트할 데이터:', updateData);

      // 업데이트 실행
      await user.update(updateData, { transaction });

      console.log('✅ [updateProfile] 데이터베이스 업데이트 완료');
      await transaction.commit();

      // 업데이트된 사용자 정보 반환
      const updatedUser = await db.User.findByPk(userId);
      const userData = updatedUser?.toJSON();
      delete (userData as any)?.password_hash;

      return res.json({
        status: 'success',
        message: '프로필이 업데이트되었습니다.',
        data: {
          user: userData
        }
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('프로필 업데이트 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '프로필 업데이트 중 오류가 발생했습니다.'
      });
    }
  }

  // 비밀번호 변경
  async changePassword(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const userId = req.user?.user_id;
      const { currentPassword, newPassword } = req.body;

      console.log('🔐 비밀번호 변경 요청:', { userId, currentPassword: !!currentPassword, newPassword: !!newPassword });

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      if (!currentPassword || !newPassword) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
        });
      }

      if (newPassword.length < 6) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '새 비밀번호는 최소 6자 이상이어야 합니다.'
        });
      }

      const user = await db.User.findByPk(userId, { transaction });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 현재 비밀번호 확인
      const isCurrentPasswordValid = await CryptoUtils.verifyPassword(currentPassword, user.get('password_hash') as string);
      
      if (!isCurrentPasswordValid) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '현재 비밀번호가 올바르지 않습니다.'
        });
      }

      // 새 비밀번호 해싱
      const newPasswordHash = await CryptoUtils.hashPassword(newPassword);

      // 비밀번호 업데이트
      await user.update({ password_hash: newPasswordHash }, { transaction });
      await transaction.commit();

      console.log('✅ 비밀번호 변경 성공:', userId);

      return res.json({
        status: 'success',
        message: '비밀번호가 변경되었습니다.'
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('❌ 비밀번호 변경 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '비밀번호 변경 중 오류가 발생했습니다.'
      });
    }
  }

  // 회원 탈퇴
  async withdrawal(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const userId = req.user?.user_id;
      const { password, reason } = req.body;

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      if (!password) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '회원 탈퇴를 위해 비밀번호를 입력해주세요.'
        });
      }

      const user = await db.User.findByPk(userId, { transaction });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 비밀번호 확인
      const isPasswordValid = await CryptoUtils.verifyPassword(password, user.get('password_hash') as string);
      
      if (!isPasswordValid) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '비밀번호가 올바르지 않습니다.'
        });
      }

      // 계정 비활성화 (완전 삭제 대신)
      await user.update({
        is_active: false
      }, { transaction });

      await transaction.commit();

      return res.json({
        status: 'success',
        message: '회원 탈퇴가 완료되었습니다. 그동안 Dayonme를 이용해 주셔서 감사했습니다.'
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('회원 탈퇴 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '회원 탈퇴 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // 이메일 중복 확인
  async checkEmail(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: '이메일을 입력해주세요.'
        });
      }

      const existingUser = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      return res.json({
        status: 'success',
        data: {
          available: !existingUser,
          message: existingUser ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.'
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: '이메일 중복 확인 중 오류가 발생했습니다.'
      });
    }
  }

  // 닉네임 중복 확인
  async checkNickname(req: Request, res: Response) {
    try {
      const { nickname } = req.query;

      if (!nickname || typeof nickname !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: '닉네임을 입력해주세요.'
        });
      }

      const existingUser = await db.User.findOne({
        where: { nickname: nickname.trim() }
      });

      return res.json({
        status: 'success',
        data: {
          available: !existingUser,
          message: existingUser ? '이미 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.'
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: '닉네임 중복 확인 중 오류가 발생했습니다.'
      });
    }
  }

  // 알림 설정 조회
  async getNotificationSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const user = await db.User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // notification_settings 파싱
      let notificationSettings = {
        like_notifications: true,
        comment_notifications: true,
        challenge_notifications: true,
        encouragement_notifications: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        daily_reminder: '20:00'
      };

      if (user.notification_settings) {
        try {
          const parsed = typeof user.notification_settings === 'string'
            ? JSON.parse(user.notification_settings)
            : user.notification_settings;
          notificationSettings = { ...notificationSettings, ...parsed };
        } catch (error) {
          console.warn('⚠️ notification_settings 파싱 오류, 기본값 사용');
        }
      }

      return res.json({
        status: 'success',
        data: notificationSettings
      });

    } catch (error: any) {
      console.error('알림 설정 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '알림 설정 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 알림 설정 업데이트
  async updateNotificationSettings(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const userId = req.user?.user_id;
      const {
        like_notifications,
        comment_notifications,
        challenge_notifications,
        encouragement_notifications,
        quiet_hours_start,
        quiet_hours_end,
        daily_reminder
      } = req.body;

      console.log('🔔 [updateNotificationSettings] 요청 데이터:', {
        userId,
        like_notifications,
        comment_notifications,
        challenge_notifications,
        encouragement_notifications,
        quiet_hours_start,
        quiet_hours_end,
        daily_reminder
      });

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const user = await db.User.findByPk(userId, { transaction });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 기존 notification_settings 가져오기
      let currentSettings = {
        like_notifications: true,
        comment_notifications: true,
        challenge_notifications: true,
        encouragement_notifications: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        daily_reminder: '20:00'
      };

      if (user.notification_settings) {
        try {
          const parsed = typeof user.notification_settings === 'string'
            ? JSON.parse(user.notification_settings)
            : user.notification_settings;
          currentSettings = { ...currentSettings, ...parsed };
        } catch (error) {
          console.warn('⚠️ 기존 notification_settings 파싱 오류, 기본값 사용');
        }
      }

      // 업데이트할 데이터 병합 (제공된 값만 업데이트)
      const updatedSettings: any = { ...currentSettings };
      if (like_notifications !== undefined) updatedSettings.like_notifications = like_notifications;
      if (comment_notifications !== undefined) updatedSettings.comment_notifications = comment_notifications;
      if (challenge_notifications !== undefined) updatedSettings.challenge_notifications = challenge_notifications;
      if (encouragement_notifications !== undefined) updatedSettings.encouragement_notifications = encouragement_notifications;
      if (quiet_hours_start !== undefined) updatedSettings.quiet_hours_start = quiet_hours_start;
      if (quiet_hours_end !== undefined) updatedSettings.quiet_hours_end = quiet_hours_end;
      if (daily_reminder !== undefined) updatedSettings.daily_reminder = daily_reminder;

      console.log('💾 [updateNotificationSettings] 업데이트할 설정:', updatedSettings);

      // 데이터베이스 업데이트 (Sequelize JSON 타입은 객체를 직접 저장)
      await user.update({
        notification_settings: updatedSettings as any
      }, { transaction });

      await transaction.commit();

      console.log('✅ [updateNotificationSettings] 알림 설정 업데이트 완료');

      return res.json({
        status: 'success',
        message: '알림 설정이 업데이트되었습니다.',
        data: updatedSettings
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('❌ 알림 설정 업데이트 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '알림 설정 업데이트 중 오류가 발생했습니다.'
      });
    }
  }

  async blockUser(req: AuthRequest, res: Response) {
    return res.json({ status: 'success', message: '사용자가 차단되었습니다.' });
  }

  async unblockUser(req: AuthRequest, res: Response) {
    return res.json({ status: 'success', message: '사용자 차단이 해제되었습니다.' });
  }

  async requestPasswordReset(req: Request, res: Response) {
    return res.json({ status: 'success', message: '비밀번호 재설정 링크를 전송했습니다.' });
  }

  async resetPassword(req: Request, res: Response) {
    return res.json({ status: 'success', message: '비밀번호가 재설정되었습니다.' });
  }

  async forgotPassword(req: Request, res: Response) {
    return this.requestPasswordReset(req, res);
  }

  async getUserStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 실제 데이터 계산
      const myDayPostsCount = await db.MyDayPost.count({
        where: { user_id: userId }
      });

      const myDayLikesCount = await db.MyDayPost.sum('like_count', {
        where: { user_id: userId }
      }) || 0;

      const myDayCommentsCount = await db.MyDayPost.sum('comment_count', {
        where: { user_id: userId }
      }) || 0;



      // 내가 건넨 공감(좋아요) 수
      let myDayLikesGivenCount = 0;
      let myDayCommentsGivenCount = 0;

      try {
        myDayLikesGivenCount = await db.MyDayLike.count({
          where: { user_id: userId }
        });

        // 내가 건넨 위로(댓글) 수
        myDayCommentsGivenCount = await db.MyDayComment.count({
          where: { user_id: userId }
        });
      } catch (error) {
        console.log('⚠️ 건넨 공감/위로 계산 생략');
      }


      // 챌린지 참여 통계 계산
      const challengeParticipantCount = await db.ChallengeParticipant.count({
        where: { user_id: userId }
      });

      console.log('🏆 챌린지 참여 통계:', {
        userId,
        participantCount: challengeParticipantCount
      });

      // 기존 통계 테이블에서 값 가져오거나 생성
      let userStats = await db.UserStats.findOne({
        where: { user_id: userId }
      });

      const calculatedStats = {
        user_id: userId,
        my_day_post_count: myDayPostsCount,
        someone_day_post_count: 0, // TODO: 위로와 공감 게시물 수
        my_day_like_received_count: myDayLikesCount,
        someone_day_like_received_count: 0, // TODO: 위로와 공감에서 받은 좋아요
        my_day_comment_received_count: myDayCommentsCount,
        someone_day_comment_received_count: 0, // TODO: 위로와 공감에서 받은 댓글
        challenge_count: challengeParticipantCount,
        last_updated: new Date(),
        my_day_like_given_count: myDayLikesGivenCount,
        my_day_comment_given_count: myDayCommentsGivenCount,
      };

      if (!userStats) {
        // 통계가 없으면 새로 생성
        userStats = await db.UserStats.create(calculatedStats);
      } else {
        // 기존 통계 업데이트
        await userStats.update(calculatedStats);
      }

      console.log('📊 실시간 통계 계산 완료:', {
        userId,
        myDayPosts: myDayPostsCount,
        myDayLikes: myDayLikesCount,
        myDayComments: myDayCommentsCount,
        challenges: challengeParticipantCount
      });

      return res.json({
        status: 'success',
        data: userStats.toJSON()
      });

    } catch (error: any) {
      console.error('사용자 통계 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '사용자 통계 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 오늘의 활동 확인 (자기 돌봄 체크리스트용)
  async getTodayActivities(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 오늘 날짜 범위 설정
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('📅 오늘의 활동 확인:', {
        userId,
        today: today.toISOString(),
        tomorrow: tomorrow.toISOString()
      });

      // 1. 오늘 게시물 작성 여부
      const postedToday = await db.MyDayPost.count({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      }) > 0;

      // 2. 오늘 좋아요를 눌렀는지 확인
      let gaveLikeToday = false;
      try {
        gaveLikeToday = await db.MyDayLike.count({
          where: {
            user_id: userId,
            created_at: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        }) > 0;
      } catch (error) {
        console.log('⚠️ 좋아요 확인 실패 (테이블 없음)');
      }

      // 3. 오늘 댓글을 작성했는지 확인
      let wroteCommentToday = false;
      try {
        wroteCommentToday = await db.MyDayComment.count({
          where: {
            user_id: userId,
            created_at: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        }) > 0;
      } catch (error) {
        console.log('⚠️ 댓글 확인 실패 (테이블 없음)');
      }

      console.log('✅ 오늘의 활동 확인 완료:', {
        postedToday,
        gaveLikeToday,
        wroteCommentToday
      });

      return res.json({
        status: 'success',
        data: {
          posted_today: postedToday,
          gave_like_today: gaveLikeToday,
          wrote_comment_today: wroteCommentToday
        }
      });

    } catch (error: any) {
      console.error('❌ 오늘의 활동 확인 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '오늘의 활동 확인 중 오류가 발생했습니다.'
      });
    }
  }

  // 상세한 챌린지 통계 조회
  async getUserChallengeStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      console.log('🏆 사용자 챌린지 통계 조회 시작:', { userId });

      // 참여한 전체 챌린지 수
      const participatedChallenges = await db.ChallengeParticipant.count({
        where: { user_id: userId }
      });

      // 생성한 챌린지 수
      const createdChallenges = await db.Challenge.count({
        where: { creator_id: userId }
      });

      // 완료한 챌린지 수 (종료일이 지난 챌린지)
      const completedChallenges = await db.ChallengeParticipant.count({
        where: { user_id: userId },
        include: [{
          model: db.Challenge,
          as: 'challenge',
          where: {
            end_date: {
              [Op.lt]: new Date()
            }
          }
        }]
      });

      // 현재 진행 중인 챌린지 수
      const activeChallenges = await db.ChallengeParticipant.count({
        where: { user_id: userId },
        include: [{
          model: db.Challenge,
          as: 'challenge',
          where: {
            start_date: {
              [Op.lte]: new Date()
            },
            end_date: {
              [Op.gte]: new Date()
            }
          }
        }]
      });

      const challengeStats = {
        participated: participatedChallenges,
        created: createdChallenges,
        completed: completedChallenges,
        active: activeChallenges
      };

      console.log('🏆 챌린지 통계 조회 완료:', challengeStats);

      return res.json({
        status: 'success',
        data: challengeStats,
        message: '챌린지 통계 조회 성공'
      });

    } catch (error) {
      console.error('❌ 챌린지 통계 조회 중 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '챌린지 통계 조회에 실패했습니다.'
      });
    }
  }

  // 특정 사용자의 통계 조회 (다른 사용자 프로필용)
  async getUserStatsByUserId(req: AuthRequest, res: Response) {
    try {
      const targetUserId = parseInt(req.params.id);
      const requestingUserId = req.user?.user_id;

      if (!requestingUserId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      if (isNaN(targetUserId)) {
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않은 사용자 ID입니다.'
        });
      }

      console.log('🔍 다른 사용자 통계 조회:', { targetUserId, requestingUserId });

      // 사용자 존재 확인 및 프라이버시 설정 확인
      const targetUser = await db.User.findByPk(targetUserId);

      if (!targetUser) {
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 프라이버시 설정 확인
      let privacySettings = { show_posts: true };
      if (targetUser.privacy_settings) {
        try {
          const parsed = typeof targetUser.privacy_settings === 'string'
            ? JSON.parse(targetUser.privacy_settings)
            : targetUser.privacy_settings;
          privacySettings = { ...privacySettings, ...parsed };
        } catch (error) {
          console.warn('⚠️ privacy_settings 파싱 오류');
        }
      }

      // 통계 공개가 거부된 경우
      if (!privacySettings.show_posts) {
        return res.json({
          status: 'success',
          data: {
            totalPosts: 0,
            totalLikes: 0,
            totalComments: 0,
            challengeCount: 0,
            joinedDate: targetUser.created_at,
            isPrivate: true
          }
        });
      }

      // 실제 데이터 계산
      const myDayPostsCount = await db.MyDayPost.count({
        where: { user_id: targetUserId }
      });

      const myDayLikesCount = await db.MyDayPost.sum('like_count', {
        where: { user_id: targetUserId }
      }) || 0;

      const myDayCommentsCount = await db.MyDayPost.sum('comment_count', {
        where: { user_id: targetUserId }
      }) || 0;

      const challengeParticipantCount = await db.ChallengeParticipant.count({
        where: { user_id: targetUserId }
      });

      const userStats = {
        totalPosts: myDayPostsCount,
        totalLikes: myDayLikesCount,
        totalComments: myDayCommentsCount,
        challengeCount: challengeParticipantCount,
        joinedDate: targetUser.created_at,
        isPrivate: false
      };

      console.log('✅ 다른 사용자 통계 조회 완료:', userStats);

      return res.json({
        status: 'success',
        data: userStats
      });

    } catch (error: any) {
      console.error('❌ 다른 사용자 통계 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '통계 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 특정 사용자의 감정 태그 조회 (다른 사용자 프로필용)
  async getUserEmotionsByUserId(req: AuthRequest, res: Response) {
    try {
      const targetUserId = parseInt(req.params.id);
      const requestingUserId = req.user?.user_id;

      if (!requestingUserId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      if (isNaN(targetUserId)) {
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않은 사용자 ID입니다.'
        });
      }

      console.log('🔍 다른 사용자 감정 태그 조회:', { targetUserId, requestingUserId });

      // 사용자 존재 확인 및 프라이버시 설정 확인
      const targetUser = await db.User.findByPk(targetUserId);

      if (!targetUser) {
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 프라이버시 설정 확인
      let privacySettings = { show_emotions: true };
      if (targetUser.privacy_settings) {
        try {
          const parsed = typeof targetUser.privacy_settings === 'string'
            ? JSON.parse(targetUser.privacy_settings)
            : targetUser.privacy_settings;
          privacySettings = { ...privacySettings, ...parsed };
        } catch (error) {
          console.warn('⚠️ privacy_settings 파싱 오류');
        }
      }

      // 감정 통계 공개가 거부된 경우
      if (!privacySettings.show_emotions) {
        return res.json({
          status: 'success',
          data: [],
          message: '감정 통계가 비공개 상태입니다.'
        });
      }

      // 감정 태그 통계 조회 (MyDay 게시물 기반 - junction table 사용)
      const emotionStats = await db.sequelize.query(`
        SELECT
          e.emotion_id,
          e.name as emotion_name,
          e.icon as emotion_icon,
          e.color as emotion_color,
          COUNT(*) as count
        FROM my_day_posts mdp
        INNER JOIN my_day_emotions mde ON mdp.post_id = mde.post_id
        INNER JOIN emotions e ON mde.emotion_id = e.emotion_id
        WHERE mdp.user_id = :userId
        GROUP BY e.emotion_id, e.name, e.icon, e.color
        ORDER BY count DESC
        LIMIT 10
      `, {
        replacements: { userId: targetUserId },
        type: QueryTypes.SELECT
      });

      console.log('✅ 다른 사용자 감정 태그 조회 완료:', emotionStats);

      return res.json({
        status: 'success',
        data: emotionStats
      });

    } catch (error: any) {
      console.error('❌ 다른 사용자 감정 태그 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '감정 태그 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 특정 사용자의 공개 게시물 조회 (다른 사용자 프로필용)
  async getUserPostsByUserId(req: AuthRequest, res: Response) {
    try {
      const targetUserId = parseInt(req.params.id);
      const requestingUserId = req.user?.user_id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      if (!requestingUserId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      if (isNaN(targetUserId)) {
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않은 사용자 ID입니다.'
        });
      }

      console.log('🔍 다른 사용자 게시물 조회:', { targetUserId, requestingUserId, page, limit });

      // 차단된 사용자인지 확인
      try {
        const blockedUsers = await db.sequelize.query(
          `SELECT blocked_user_id FROM user_blocks WHERE user_id = ?`,
          { replacements: [requestingUserId], type: QueryTypes.SELECT }
        );
        const blockedUserIds = (blockedUsers as any[]).map((item: any) => item.blocked_user_id);

        if (blockedUserIds.includes(targetUserId)) {
          console.log('🚫 [getUserPostsByUserId] 차단된 사용자의 게시물 접근 시도:', { requestingUserId, targetUserId });
          return res.status(403).json({
            status: 'error',
            message: '차단한 사용자의 게시물을 볼 수 없습니다.'
          });
        }
      } catch (blockCheckError) {
        console.warn('⚠️ [getUserPostsByUserId] 차단 확인 실패 (계속 진행):', blockCheckError);
      }

      // 사용자 존재 확인 및 프라이버시 설정 확인
      const targetUser = await db.User.findByPk(targetUserId);

      if (!targetUser) {
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 프라이버시 설정 확인
      let privacySettings = { show_posts: true };
      if (targetUser.privacy_settings) {
        try {
          const parsed = typeof targetUser.privacy_settings === 'string'
            ? JSON.parse(targetUser.privacy_settings)
            : targetUser.privacy_settings;
          privacySettings = { ...privacySettings, ...parsed };
        } catch (error) {
          console.warn('⚠️ privacy_settings 파싱 오류');
        }
      }

      // 게시물 공개가 거부된 경우
      if (!privacySettings.show_posts) {
        return res.json({
          status: 'success',
          data: {
            posts: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          },
          message: '게시물이 비공개 상태입니다.'
        });
      }

      // MyDay 게시물 조회
      const myDayPosts = await db.MyDayPost.findAll({
        where: {
          user_id: targetUserId
        },
        include: [
          {
            model: db.Emotion,
            as: 'emotions',
            attributes: ['emotion_id', 'name', 'icon', 'color'],
            through: { attributes: [] }
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // SomeoneDay (위로와 공감) 게시물 조회
      const someoneDayPosts = await db.SomeoneDayPost.findAll({
        where: {
          user_id: targetUserId
        },
        include: [
          {
            model: db.Emotion,
            as: 'emotions',
            attributes: ['emotion_id', 'name', 'icon', 'color'],
            through: { attributes: [] }
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // 두 종류의 게시물을 합치고 created_at 기준으로 정렬
      const allPosts = [
        ...myDayPosts.map(post => {
          const postData: any = post.get({ plain: true });
          return {
            post_id: post.post_id,
            content: post.content,
            emotions: (post as any).emotions || [],
            like_count: post.like_count,
            comment_count: post.comment_count,
            created_at: postData.created_at || postData.createdAt,
            post_type: 'my_day'
          };
        }),
        ...someoneDayPosts.map(post => {
          const postData: any = post.get({ plain: true });
          return {
            post_id: post.post_id,
            title: post.title,
            content: post.content,
            emotions: (post as any).emotions || [],
            like_count: post.like_count,
            comment_count: post.comment_count,
            created_at: postData.created_at || postData.createdAt,
            post_type: 'someone_day'
          };
        })
      ].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // 페이지네이션 적용
      const total = allPosts.length;
      const paginatedPosts = allPosts.slice(offset, offset + limit);
      const totalPages = Math.ceil(total / limit);

      console.log('✅ 다른 사용자 게시물 조회 완료:', {
        targetUserId,
        myDayCount: myDayPosts.length,
        someoneDayCount: someoneDayPosts.length,
        total,
        page,
        totalPages
      });

      // 디버깅: 첫 번째 게시물 확인
      if (paginatedPosts.length > 0) {
        console.log('📝 첫 번째 게시물:', {
          post_id: paginatedPosts[0].post_id,
          post_type: paginatedPosts[0].post_type,
          has_created_at: !!paginatedPosts[0].created_at
        });
      }

      // ISO 문자열로 명시적 변환
      const formattedPosts = paginatedPosts.map(post => ({
        ...post,
        created_at: post.created_at ? new Date(post.created_at).toISOString() : null
      }));

      return res.json({
        status: 'success',
        data: {
          posts: formattedPosts,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      });

    } catch (error: any) {
      console.error('❌ 다른 사용자 게시물 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '게시물 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 첫 번째 활동 정보 조회
  async getUserFirstActivity(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      console.log('📅 사용자 첫 번째 활동 조회 시작:', { userId });

      // 사용자 가입일
      const user = await db.User.findByPk(userId);
      const signupDate = user?.created_at;

      // 첫 번째 MyDay 게시물
      const firstMyDayPost = await db.MyDayPost.findOne({
        where: { user_id: userId },
        order: [['created_at', 'ASC']]
      });

      // 첫 번째 챌린지 참여
      const firstChallengeParticipation = await db.ChallengeParticipant.findOne({
        where: { user_id: userId },
        order: [['joined_at', 'ASC']]
      });

      // 가장 이른 활동 날짜 찾기
      const activityDates = [
        signupDate,
        firstMyDayPost?.created_at,
        firstChallengeParticipation?.joined_at
      ].filter(date => date != null);

      const firstActivityDate = activityDates.length > 0
        ? new Date(Math.min(...activityDates.map(date => date!.getTime())))
        : signupDate;

      // D+ 계산 (첫 활동부터 오늘까지)
      const daysSinceFirstActivity = firstActivityDate
        ? Math.floor((new Date().getTime() - firstActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const activityInfo = {
        signup_date: signupDate,
        first_activity_date: firstActivityDate,
        first_post_date: firstMyDayPost?.created_at || null,
        first_challenge_date: firstChallengeParticipation?.joined_at || null,
        days_since_first_activity: daysSinceFirstActivity
      };

      console.log('📅 첫 번째 활동 조회 완료:', activityInfo);

      return res.json({
        status: 'success',
        data: activityInfo,
        message: '첫 번째 활동 정보 조회 성공'
      });

    } catch (error) {
      console.error('❌ 첫 번째 활동 조회 중 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '첫 번째 활동 조회에 실패했습니다.'
      });
    }
  }

  // 나의 마음 저장
  async saveIntention(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const { period, intention_text } = req.body;

      if (!userId) {
        return res.status(401).json({ status: 'error', message: '인증이 필요합니다.' });
      }

      // period 유효성 검증
      const validPeriods = ['week', 'month', 'year'];
      if (!period || !validPeriods.includes(period)) {
        return res.status(400).json({
          status: 'error',
          message: 'period는 week, month, year 중 하나여야 합니다.'
        });
      }

      if (!intention_text || intention_text.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: '마음 내용을 입력해주세요.'
        });
      }

      const [intention, created] = await db.UserIntention.upsert({
        user_id: userId,
        period: period as 'week' | 'month' | 'year',
        intention_text: intention_text.trim()
      });

      return res.json({
        status: 'success',
        data: intention,
        message: created ? '마음이 저장되었습니다.' : '마음이 업데이트되었습니다.'
      });
    } catch (error) {
      console.error('마음 저장 오류:', error);
      return res.status(500).json({ status: 'error', message: '마음 저장에 실패했습니다.' });
    }
  }

  // 나의 마음 조회
  async getIntention(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const periodQuery = req.query.period as string;

      if (!userId) {
        return res.status(401).json({ status: 'error', message: '인증이 필요합니다.' });
      }

      // period 유효성 검증
      const validPeriods = ['week', 'month', 'year'];
      if (!periodQuery || !validPeriods.includes(periodQuery)) {
        return res.status(400).json({
          status: 'error',
          message: 'period는 week, month, year 중 하나여야 합니다.'
        });
      }

      const period = periodQuery as 'week' | 'month' | 'year';

      const intention = await db.UserIntention.findOne({
        where: { user_id: userId, period }
      });

      return res.json({
        status: 'success',
        data: intention
      });
    } catch (error) {
      console.error('마음 조회 오류:', error);
      return res.status(500).json({ status: 'error', message: '마음 조회에 실패했습니다.' });
    }
  }

  // 데이터 내보내기 (GDPR 준수)
  // 데이터 내보내기 요청 (개선된 버전)
  async exportUserData(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      console.log('📦 데이터 내보내기 요청:', { userId, email: user.email });

      // 비동기 처리 시작
      const { dataExportService } = require('../services/dataExportService');
      await dataExportService.requestExport(userId, user.email);

      return res.json({
        status: 'success',
        message: '데이터 내보내기를 시작했습니다. 완료되면 이메일로 다운로드 링크가 전송됩니다.',
        data: {
          estimated_time: '5-10분',
          email: user.email
        }
      });

    } catch (error: any) {
      console.error('❌ 데이터 내보내기 요청 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '데이터 내보내기 요청 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 내보내기 진행 상태 확인
  async getExportProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { dataExportService } = require('../services/dataExportService');
      const progress = dataExportService.getProgress(userId);

      if (!progress) {
        return res.json({
          status: 'success',
          data: {
            status: 'none',
            message: '진행 중인 내보내기가 없습니다.'
          }
        });
      }

      return res.json({
        status: 'success',
        data: progress
      });

    } catch (error: any) {
      console.error('❌ 진행 상태 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '진행 상태 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 내보내기 파일 다운로드
  async downloadExportFile(req: AuthRequest, res: Response) {
    try {
      const { filename } = req.params;
      const path = require('path');
      const fs = require('fs');

      const filePath = path.join(process.cwd(), 'exports', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: 'error',
          message: '파일을 찾을 수 없습니다.'
        });
      }

      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('파일 다운로드 오류:', err);
          if (!res.headersSent) {
            res.status(500).json({
              status: 'error',
              message: '파일 다운로드 중 오류가 발생했습니다.'
            });
          }
        }
      });

    } catch (error: any) {
      console.error('❌ 파일 다운로드 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '파일 다운로드 중 오류가 발생했습니다.'
      });
    }
  }
}

// Export
const userController = new UserController();
export default userController;