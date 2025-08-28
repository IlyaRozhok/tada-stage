import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Property } from "../../entities/property.entity";
import { FeaturedController } from "./featured.controller";
import { FeaturedService } from "./featured.service";
import { PropertiesModule } from "../properties/properties.module";

@Module({
  imports: [TypeOrmModule.forFeature([Property]), PropertiesModule],
  controllers: [FeaturedController],
  providers: [FeaturedService],
  exports: [FeaturedService],
})
export class FeaturedModule {}
