// models/ReactionType.ts
import { Model, DataTypes, Sequelize } from 'sequelize';

interface ReactionTypeAttributes {
  reaction_type_id: number;
  name: string;
  icon: string;
  emoji: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

class ReactionType extends Model<ReactionTypeAttributes> implements ReactionTypeAttributes {
  public reaction_type_id!: number;
  public name!: string;
  public icon!: string;
  public emoji!: string;
  public color!: string;
  public display_order!: number;
  public is_active!: boolean;

  static initModel(sequelize: Sequelize): typeof ReactionType {
    ReactionType.init(
      {
        reaction_type_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        icon: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        emoji: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        color: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        display_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'reaction_types',
        timestamps: false,
      }
    );

    return ReactionType;
  }

  static associate(models: any) {
    // associations will be defined here if needed
  }
}

export default ReactionType;
