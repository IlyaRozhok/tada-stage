import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
  Column,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { Property } from "./property.entity";

@Entity("favourites")
@Unique("unique_user_property_favourite", ["userId", "propertyId"]) // Prevent duplicate entries
export class Favourite {
  @ApiProperty({ description: "Unique favourite entry identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "User ID who favourited the property" })
  @Column("uuid")
  userId: string;

  @ApiProperty({ description: "Property ID that was favourited" })
  @Column("uuid")
  propertyId: string;

  @ApiProperty({ description: "User who favourited the property" })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ApiProperty({ description: "Property that was favourited" })
  @ManyToOne(() => Property, { onDelete: "CASCADE" })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @ApiProperty({ description: "Date when property was favourited" })
  @CreateDateColumn()
  created_at: Date;
}
