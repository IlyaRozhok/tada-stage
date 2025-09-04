import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AppController } from "./app.controller";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { PropertyMediaModule } from "./modules/property-media/property-media.module";
import { ShortlistModule } from "./modules/shortlist/shortlist.module";
import { OperatorModule } from "./modules/operator/operator.module";
import { S3Module } from "./common/services/s3.module";
import { typeOrmConfig } from "./database/typeorm.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV ? undefined : ".env",
      ignoreEnvFile: !!process.env.NODE_ENV,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig(process.env),
    }),
    S3Module,

    AuthModule,
    UsersModule,
    PreferencesModule,
    MatchingModule,
    PropertiesModule,
    PropertyMediaModule,
    ShortlistModule,
    OperatorModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
