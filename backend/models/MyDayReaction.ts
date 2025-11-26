// models/MyDayReaction.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface MyDayReactionAttributes {
  reaction_id: number;
  post_id: number;
  user_id: number;
  reaction_type_id: number;
  created_at: Date;
}

interface MyDayReactionCreationAttributes {
  post_id: number;
  user_id: number;
  reaction_type_id: number;
  created_at?: Date;
}

class MyDayReaction extends Model<MyDayReactionAttributes, MyDayReactionCreationAttributes> implements MyDayReactionAttributes {
  public reaction_id!: number;
  public post_id!: number;
  public user_id!: number;
  public reaction_type_id!: number;
  public created_at!: Date;

  static initModel(sequelize: Sequelize): typeof MyDayReaction {
    MyDayReaction.init(
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
        tableName: 'my_day_reactions',
        timestamps: false,
        indexes: [
          {
            unique: true,
            fields: ['post_id', 'user_id', 'reaction_type_id'],
          },
        ],
      }
    );

    return MyDayReaction;
  }

  static associate(models: any) {
    MyDayReaction.belongsTo(models.MyDayPost, {
      foreignKey: 'post_id',
      as: 'post',
    });

    MyDayReaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    MyDayReaction.belongsTo(models.ReactionType, {
      foreignKey: 'reaction_type_id',
      as: 'reactionType',
    });
  }
}

export default MyDayReaction;
