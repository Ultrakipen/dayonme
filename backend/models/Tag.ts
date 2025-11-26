import { DataTypes, Model, Sequelize } from 'sequelize';

interface TagAttributes {
  tag_id?: number;  // 선택적으로 변경
  name: string;
}

class Tag extends Model<TagAttributes> {
  public tag_id!: number;
  public name!: string;
  
  public static initialize(sequelize: Sequelize) {
    const model = Tag.init(
      {
        tag_id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        }
      },
      {
        sequelize,
        modelName: 'Tag',
        tableName: 'tags',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['name']
          }
        ]
      }
    );
    return model;
  }
  
  public static associate(models: any): void {
    Tag.belongsToMany(models.SomeoneDayPost, {
      through: models.SomeoneDayTag,
      foreignKey: 'tag_id',
      otherKey: 'post_id',
      as: 'posts'
    });
  }
}

export default Tag;