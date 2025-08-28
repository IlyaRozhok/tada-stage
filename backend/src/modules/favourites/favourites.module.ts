import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FavouritesController } from "./favourites.controller";
import { FavouritesService } from "./favourites.service";
import { Favourite } from "../../entities/favourite.entity";
import { Property } from "../../entities/property.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Favourite, Property])],
  controllers: [FavouritesController],
  providers: [FavouritesService],
  exports: [FavouritesService],
})
export class FavouritesModule {}
