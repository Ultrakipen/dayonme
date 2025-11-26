// models/SomeoneDayReaction.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface SomeoneDayReactionAttributes {
  reaction_id: number;
  post_id: number;
  user_id: number;
  reaction_type_id: number;
  created_at: Date;
}

interface SomeoneDayReactionCreationAttributes {
  post_id: number;
  user_id: number;
  reaction_type_id: number;
  created_at?: Date;
}

class SomeoneDayReaction extends Model<SomeoneDayReactionAttributes, SomeoneDayReactionCreationAttributes> implements SomeoneDayReactionAttributes {
  public reaction_id!: number;
  public post_id!: number;
  public user_id!: number;
  public reaction_type_id!: number;
  public created_at!: Date;

  static initModel(sequelize: Sequelize): typeof SomeoneDayReaction {
    SomeoneDayReaction.init(
      {
        reaction_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        post_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        reaction_type_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'someone_day_reactions',
        timestamps: false,
        indexes: [
          {
            unique: true,
            fields: ['post_id', 'user_id', 'reaction_type_id'],
          },
        ],
      }
    );

    return SomeoneDayReaction;
  }

  static associate(models: any) {
    SomeoneDayReaction.belongsTo(models.SomeoneDayPost, {
      foreignKey: 'post_id',
      as: 'post',
    });

    SomeoneDayReaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    SomeoneDayReaction.belongsTo(models.ReactionType, {
      foreignKey: 'reaction_type_id',
      as: 'reactionType',
    });
  }
}

export default SomeoneDayReaction;
