import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserContactFields1735480000000 implements MigrationInterface {
  name = "AddUserContactFields1735480000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add phone field to users table
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "phone",
        type: "varchar",
        isNullable: true,
        comment: "User phone number",
      })
    );

    // Add date_of_birth field to users table
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "date_of_birth",
        type: "date",
        isNullable: true,
        comment: "User date of birth",
      })
    );

    // Add nationality field to users table
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "nationality",
        type: "varchar",
        isNullable: true,
        comment: "User nationality",
      })
    );

    console.log(
      "Added phone, date_of_birth, and nationality fields to users table"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove nationality field
    await queryRunner.dropColumn("users", "nationality");

    // Remove date_of_birth field
    await queryRunner.dropColumn("users", "date_of_birth");

    // Remove phone field
    await queryRunner.dropColumn("users", "phone");

    console.log(
      "Removed phone, date_of_birth, and nationality fields from users table"
    );
  }
}
