import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTiempoUsuario1721000000000 implements MigrationInterface {
  name = 'AddTiempoUsuario1721000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tiempo_usuario (
        usuario_id        uuid            PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
        segundos_totales  int             NOT NULL DEFAULT 0,
        actualizado_en    timestamptz     NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `COMMENT ON TABLE tiempo_usuario IS 'Acumulado de segundos que cada usuario ha pasado resolviendo evaluaciones. Una fila por usuario.'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN tiempo_usuario.segundos_totales IS 'Suma de la duración (finalizado_en - creado_en) de todas las evaluaciones finalizadas por el usuario.'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS tiempo_usuario`);
  }
}
