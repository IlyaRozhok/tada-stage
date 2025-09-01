import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePropertyMediaTable1735820000000
  implements MigrationInterface
{
  name = "CreatePropertyMediaTable1735820000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "property_media",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "property_id",
            type: "uuid",
          },
          {
            name: "url",
            type: "varchar",
          },
          {
            name: "s3_key",
            type: "varchar",
          },
          {
            name: "type",
            type: "varchar",
            default: "'image'",
          },
          {
            name: "mime_type",
            type: "varchar",
          },
          {
            name: "original_filename",
            type: "varchar",
          },
          {
            name: "file_size",
            type: "bigint",
          },
          {
            name: "order_index",
            type: "int",
            default: "0",
          },
          {
            name: "is_featured",
            type: "boolean",
            default: false,
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
      }),
      true
    );

    await queryRunner.createForeignKey(
      "property_media",
      new TableForeignKey({
        columnNames: ["property_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "properties",
        onDelete: "CASCADE",
      })
    );

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_property_media_property_id" ON "property_media" ("property_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_property_media_order_index" ON "property_media" ("property_id", "order_index");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_property_media_featured" ON "property_media" ("property_id", "is_featured") WHERE "is_featured" = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_property_media_featured"`);
    await queryRunner.query(`DROP INDEX "IDX_property_media_order_index"`);
    await queryRunner.query(`DROP INDEX "IDX_property_media_property_id"`);
    await queryRunner.dropTable("property_media");
  }
}
 