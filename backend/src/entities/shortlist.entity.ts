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

@Entity("shortlist")
@Unique("unique_user_property", ["userId", "propertyId"]) // Prevent duplicate entries
export class Shortlist {
  @ApiProperty({ description: "Unique shortlist entry identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "User ID who shortlisted the property" })
  @Column("uuid")
  userId: string;

  @ApiProperty({ description: "Property ID that was shortlisted" })
  @Column("uuid")
  propertyId: string;

  @ApiProperty({ description: "User who shortlisted the property" })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ApiProperty({ description: "Property that was shortlisted" })
  @ManyToOne(() => Property, { onDelete: "CASCADE" })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @ApiProperty({ description: "Date when property was shortlisted" })
  @CreateDateColumn()
  created_at: Date;
}
