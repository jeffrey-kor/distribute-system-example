import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: false })
  title: string;

  @Column()
  image: string;

  @Column({ default: 0 })
  likes: number;

}