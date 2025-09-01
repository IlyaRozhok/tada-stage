import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUrlToPropertyMedia1752067887898 implements MigrationInterface {
    name = 'AddUrlToPropertyMedia1752067887898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "property_media" ADD "url" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "property_media" DROP COLUMN "url"`);
    }

}
