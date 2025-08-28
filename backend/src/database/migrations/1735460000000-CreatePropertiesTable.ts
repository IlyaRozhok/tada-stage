import { MigrationInterface, QueryRunner, Table, ForeignKey } from "typeorm";

export class CreatePropertiesTable1735460000000 implements MigrationInterface {
  name = "CreatePropertiesTable1735460000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "properties",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "title",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: false,
          },
          {
            name: "address",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "price",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "bedrooms",
            type: "int",
            isNullable: false,
          },
          {
            name: "bathrooms",
            type: "int",
            isNullable: false,
          },
          {
            name: "property_type",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "furnishing",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "lifestyle_features",
            type: "text",
            isNullable: true,
          },
          {
            name: "available_from",
            type: "date",
            isNullable: false,
          },
          {
            name: "images",
            type: "text",
            isNullable: true,
          },
          {
            name: "is_btr",
            type: "boolean",
            default: false,
          },
          {
            name: "operator_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          {
            columnNames: ["operator_id"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("properties");
  }
}
