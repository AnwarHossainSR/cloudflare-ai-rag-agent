import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentStoragePath1700000000004 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE documents ADD COLUMN storage_path varchar(1024);`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE documents DROP COLUMN storage_path;`);
  }
}
