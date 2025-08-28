import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmConfig = (env: NodeJS.ProcessEnv): TypeOrmModuleOptions => {
  const isDev = env.NODE_ENV === "development";
  const isStage = env.NODE_ENV === "stage";

  return {
    type: "postgres",
    host: env.DB_HOST,
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    autoLoadEntities: true,
    synchronize: isDev || isStage ? env.TYPEORM_SYNCHRONIZE === "true" : false,
    logging: env.TYPEORM_LOGGING === "true",
    migrationsRun: !isDev && !isStage,
    migrations: ["dist/migrations/*.js"],
    ssl: env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
};
