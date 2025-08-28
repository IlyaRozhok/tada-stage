import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import { User, Preferences } from "./entities";

// Controllers
import { AppController } from "./app.controller";

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { PropertyMediaModule } from "./modules/property-media/property-media.module";
import { ShortlistModule } from "./modules/shortlist/shortlist.module";
import { FavouritesModule } from "./modules/favourites/favourites.module";
import { OperatorModule } from "./modules/operator/operator.module";
import { FeaturedModule } from "./modules/featured/featured.module";
import { dataSourceOptions } from "./database/data-source";
import { S3Service } from "./common/services/s3.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    TypeOrmModule.forRoot(dataSourceOptions),

    AuthModule,
    UsersModule,
    PreferencesModule,
    MatchingModule,
    PropertiesModule,
    PropertyMediaModule,
    ShortlistModule,
    FavouritesModule,
    OperatorModule,
    FeaturedModule,
  ],
  controllers: [AppController],
  providers: [S3Service],
})
export class AppModule {}
