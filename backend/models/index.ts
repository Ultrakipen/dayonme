// models/index.ts
import { Dialect, Sequelize } from 'sequelize';
import { config } from '../config/environment';

// 모델 imports
import BestPost from './BestPost';
import Challenge from './Challenge';
import ChallengeComment from './ChallengeComment';
import ChallengeLike from './ChallengeLike';
import ChallengeCommentLike from './ChallengeCommentLike';
import ChallengeEmotion from './ChallengeEmotion';
import ChallengeParticipant from './ChallengeParticipant';
import ChallengeReport from './ChallengeReport';
import { SimpleChallenge } from './SimpleChallenge';
import { SimpleChallengeParticipant } from './SimpleChallengeParticipant';
import { SimpleChallengeEmotion } from './SimpleChallengeEmotion';
import { Emotion } from './Emotion';
import { EmotionLog } from './EmotionLog';
import EncouragementMessage from './EncouragementMessage';
import AnonymousEncouragement from './AnonymousEncouragement';
import EncouragementDailyLimit from './EncouragementDailyLimit';
import ReactionType from './ReactionType';
import MyDayReaction from './MyDayReaction';
import SomeoneDayReaction from './SomeoneDayReaction';
import MyDayComment from './MyDayComment';
import MyDayCommentLike from './MyDayCommentLike';
import MyDayCommentReport from './MyDayCommentReport';
import MyDayEmotion from './MyDayEmotion';
import MyDayLike from './MyDayLike';
import MyDayPost from './MyDayPost';
import MyDayPostReport from './MyDayPostReport';
import Notification from './Notification';
import PostRecommendation from './PostRecommendation';
import PostReport from './PostReport';
import PostTag from './PostTag';
import SomeoneDayComment from './SomeoneDayComment';
import SomeoneDayCommentLike from './SomeoneDayCommentLike'; // 새로 추가
import SomeoneDayEmotion from './SomeoneDayEmotion'; // 새로 추가
import SomeoneDayLike from './SomeoneDayLike';
import SomeoneDayPost from './SomeoneDayPost';
import SomeoneDayTag from './SomeoneDayTag';
import Tag from './Tag';
import { User } from './User';
import UserBlock from './UserBlock';
import UserGoal from './UserGoal';
import UserStats from './UserStats';
import UserIntention from './UserIntention';
import Bookmark from './Bookmark';
import Notice from './Notice';

// Sequelize 설정
const sequelizeConfig = config.database.dialect === 'sqlite' 
  ? {
      dialect: 'sqlite' as Dialect,
      storage: config.database.name,
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: false
      },
      logging: config.logging.level === 'debug' ? console.log : false
    }
  : {
      dialect: 'mysql' as Dialect,
      host: config.database.host,
      port: config.database.port,
      username: config.database.user,
      password: config.database.password,
      database: config.database.name,
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: false
      },
      logging: config.logging.level === 'debug' ? console.log : false
    };

console.log('데이터베이스 설정:', {
  NODE_ENV: config.NODE_ENV,
  dialect: sequelizeConfig.dialect,
  host: sequelizeConfig.host,
  database: sequelizeConfig.database
});

const sequelizeInstance = new Sequelize(sequelizeConfig);

export class Database {
  public sequelize: Sequelize;
  public UserBlock!: typeof UserBlock;
  public User!: typeof User;
  public Emotion!: typeof Emotion;
  public EmotionLog!: typeof EmotionLog;
  public BestPost!: typeof BestPost;
  public Challenge!: typeof Challenge;
  public ChallengeComment!: typeof ChallengeComment;
  public ChallengeLike!: typeof ChallengeLike;
  public ChallengeCommentLike!: typeof ChallengeCommentLike;
  public ChallengeEmotion!: typeof ChallengeEmotion;
  public ChallengeParticipant!: typeof ChallengeParticipant;
  public ChallengeReport!: typeof ChallengeReport;
  public SimpleChallenge!: typeof SimpleChallenge;
  public SimpleChallengeParticipant!: typeof SimpleChallengeParticipant;
  public SimpleChallengeEmotion!: typeof SimpleChallengeEmotion;
  public EncouragementMessage!: typeof EncouragementMessage;
  public MyDayComment!: typeof MyDayComment;
  public MyDayCommentLike!: typeof MyDayCommentLike;
  public MyDayCommentReport!: typeof MyDayCommentReport;
  public MyDayEmotion!: typeof MyDayEmotion;
  public MyDayLike!: typeof MyDayLike;
  public MyDayPost!: typeof MyDayPost;
  public MyDayPostReport!: typeof MyDayPostReport;
  public Notification!: typeof Notification;
  public PostRecommendation!: typeof PostRecommendation;
  public PostReport!: typeof PostReport;
  public PostTag!: typeof PostTag;
  public SomeoneDayComment!: typeof SomeoneDayComment;
  public SomeoneDayCommentLike!: typeof SomeoneDayCommentLike; // 새로 추가
  public SomeoneDayEmotion!: typeof SomeoneDayEmotion; // 새로 추가
  public SomeoneDayLike!: typeof SomeoneDayLike;
  public SomeoneDayPost!: typeof SomeoneDayPost;
  public SomeoneDayTag!: typeof SomeoneDayTag;
  public Tag!: typeof Tag;
  public UserGoal!: typeof UserGoal;
  public UserStats!: typeof UserStats;
  public UserIntention!: typeof UserIntention;
  public AnonymousEncouragement!: typeof AnonymousEncouragement;
  public EncouragementDailyLimit!: typeof EncouragementDailyLimit;
  public ReactionType!: typeof ReactionType;
  public MyDayReaction!: typeof MyDayReaction;
  public SomeoneDayReaction!: typeof SomeoneDayReaction;
  public Bookmark!: typeof Bookmark;
  public Notice!: typeof Notice;

  constructor(sequelizeInstance: Sequelize) {
    if (!sequelizeInstance) {
      throw new Error('Sequelize 인스턴스가 필요합니다');
    }
    this.sequelize = sequelizeInstance;
    this.initializeModels();
    this.setupAssociations();
  }

  private initializeModels() {
    try {
      this.User = User.initialize(this.sequelize);
      this.Emotion = Emotion.initialize(this.sequelize);
      this.EmotionLog = EmotionLog.initialize(this.sequelize);
      this.MyDayPost = MyDayPost.initialize(this.sequelize);
      this.MyDayComment = MyDayComment.initialize(this.sequelize);
      this.MyDayCommentLike = MyDayCommentLike.initialize(this.sequelize);
      this.MyDayCommentReport = MyDayCommentReport.initialize(this.sequelize);
      this.MyDayLike = MyDayLike.initialize(this.sequelize);
      this.MyDayEmotion = MyDayEmotion.initialize(this.sequelize);
      this.MyDayPostReport = MyDayPostReport.initialize(this.sequelize);
      this.SomeoneDayPost = SomeoneDayPost.initialize(this.sequelize);
      this.SomeoneDayComment = SomeoneDayComment.initialize(this.sequelize);
      this.SomeoneDayCommentLike = SomeoneDayCommentLike.initialize(this.sequelize); // 새로 추가
      this.SomeoneDayEmotion = SomeoneDayEmotion.initialize(this.sequelize); // 새로 추가
      this.SomeoneDayLike = SomeoneDayLike.initialize(this.sequelize);
      this.SomeoneDayTag = SomeoneDayTag.initialize(this.sequelize);
      this.Tag = Tag.initialize(this.sequelize);
      this.Challenge = Challenge.initialize(this.sequelize);
      this.ChallengeEmotion = ChallengeEmotion.initialize(this.sequelize);
      this.ChallengeComment = ChallengeComment.initialize(this.sequelize);
      this.ChallengeLike = ChallengeLike.initialize(this.sequelize);
      this.ChallengeCommentLike = ChallengeCommentLike.initialize(this.sequelize);
      this.ChallengeParticipant = ChallengeParticipant.initialize(this.sequelize);
      this.ChallengeReport = ChallengeReport.initialize(this.sequelize);
      this.SimpleChallenge = SimpleChallenge.initialize(this.sequelize);
      this.SimpleChallengeParticipant = SimpleChallengeParticipant.initialize(this.sequelize);
      this.SimpleChallengeEmotion = SimpleChallengeEmotion.initialize(this.sequelize);
      this.Notification = Notification.initialize(this.sequelize);
      this.UserGoal = UserGoal.initialize(this.sequelize);
      this.UserStats = UserStats.initialize(this.sequelize);
      this.UserIntention = UserIntention.initialize(this.sequelize);
      this.BestPost = BestPost.initialize(this.sequelize);
      this.PostReport = PostReport.initialize(this.sequelize);
      this.PostRecommendation = PostRecommendation.initialize(this.sequelize);
      this.PostTag = PostTag.initialize(this.sequelize);
      this.UserBlock = UserBlock.initialize(this.sequelize);
      this.EncouragementMessage = EncouragementMessage.initialize(this.sequelize);
      this.AnonymousEncouragement = AnonymousEncouragement.initModel(this.sequelize);
      this.EncouragementDailyLimit = EncouragementDailyLimit.initModel(this.sequelize);
      this.ReactionType = ReactionType.initModel(this.sequelize);
      this.MyDayReaction = MyDayReaction.initModel(this.sequelize);
      this.SomeoneDayReaction = SomeoneDayReaction.initModel(this.sequelize);
      this.Bookmark = Bookmark.initialize(this.sequelize);
      this.Notice = Notice.initialize(this.sequelize);

      console.log('모든 모델이 성공적으로 초기화되었습니다');
    } catch (error) {
      console.error('모델 초기화 중 오류:', error);
      throw error;
    }
  }

  private setupAssociations() {
    try {
      const models = {
        User: this.User,
        Emotion: this.Emotion,
        EmotionLog: this.EmotionLog,
        MyDayPost: this.MyDayPost,
        MyDayComment: this.MyDayComment,
        MyDayCommentLike: this.MyDayCommentLike,
        MyDayCommentReport: this.MyDayCommentReport,
        MyDayLike: this.MyDayLike,
        MyDayEmotion: this.MyDayEmotion,
        MyDayPostReport: this.MyDayPostReport,
        SomeoneDayPost: this.SomeoneDayPost,
        SomeoneDayComment: this.SomeoneDayComment,
        SomeoneDayCommentLike: this.SomeoneDayCommentLike, // 새로 추가
        SomeoneDayEmotion: this.SomeoneDayEmotion, // 새로 추가
        SomeoneDayLike: this.SomeoneDayLike,
        SomeoneDayTag: this.SomeoneDayTag,
        Tag: this.Tag,
        Challenge: this.Challenge,
        ChallengeComment: this.ChallengeComment,
        ChallengeLike: this.ChallengeLike,
        ChallengeCommentLike: this.ChallengeCommentLike,
        ChallengeParticipant: this.ChallengeParticipant,
        ChallengeEmotion: this.ChallengeEmotion,
        ChallengeReport: this.ChallengeReport,
        SimpleChallenge: this.SimpleChallenge,
        SimpleChallengeParticipant: this.SimpleChallengeParticipant,
        SimpleChallengeEmotion: this.SimpleChallengeEmotion,
        Notification: this.Notification,
        UserGoal: this.UserGoal,
        UserStats: this.UserStats,
        UserIntention: this.UserIntention,
        BestPost: this.BestPost,
        PostReport: this.PostReport,
        PostRecommendation: this.PostRecommendation,
        PostTag: this.PostTag,
        UserBlock: this.UserBlock,
        EncouragementMessage: this.EncouragementMessage,
        AnonymousEncouragement: this.AnonymousEncouragement,
        EncouragementDailyLimit: this.EncouragementDailyLimit,
        ReactionType: this.ReactionType,
        MyDayReaction: this.MyDayReaction,
        SomeoneDayReaction: this.SomeoneDayReaction,
        Bookmark: this.Bookmark
      };

      Object.values(models).forEach((model: any) => {
        if (model.associate) {
          model.associate(models);
        }
      });

      console.log('모든 연관관계가 설정되었습니다');
    } catch (error) {
      console.error('연관관계 설정 중 오류:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      console.log('데이터베이스 연결 성공');
      return true;
    } catch (error) {
      console.error('데이터베이스 연결 실패:', error);
      return false;
    }
  }

  async sync(options = {}): Promise<void> {
    try {
      await this.sequelize.sync(options);
      console.log('데이터베이스 동기화 완료');
    } catch (error) {
      console.error('데이터베이스 동기화 실패:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('데이터베이스 연결이 종료되었습니다');
    }
  }
}

const db = new Database(sequelizeInstance);

// 개별 모델들도 export
export {
  sequelizeInstance as sequelize,
  User,
  Emotion,
  EmotionLog,
  MyDayPost,
  MyDayComment,
  MyDayCommentLike,
  MyDayCommentReport,
  MyDayLike,
  MyDayEmotion,
  MyDayPostReport,
  SomeoneDayPost,
  SomeoneDayComment,
  SomeoneDayCommentLike, // 새로 추가
  SomeoneDayEmotion, // 새로 추가
  SomeoneDayLike,
  SomeoneDayTag,
  Tag,
  Challenge,
  ChallengeLike,
  ChallengeParticipant,
  ChallengeEmotion,
  ChallengeReport,
  SimpleChallenge,
  SimpleChallengeParticipant,
  SimpleChallengeEmotion,
  Notification,
  UserGoal,
  UserStats,
  UserIntention,
  BestPost,
  PostReport,
  PostRecommendation,
  PostTag,
  UserBlock,
  EncouragementMessage,
  AnonymousEncouragement,
  EncouragementDailyLimit,
  ReactionType,
  MyDayReaction,
  SomeoneDayReaction,
  Bookmark,
  Notice
};

export default db;
