import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type Delivery = {
  region: string;
  city: string;
  street: string;
  house: string;
  index: string;
};

export type UserDocument = User & Document;
@Schema()
export class User {
  @Prop()
  firstName: string;
  @Prop()
  lastName: string;
  @Prop()
  phone: string;
  @Prop()
  email: string;
  @Prop({ min: 6 })
  password: string;
  @Prop()
  birthday: string;
  @Prop({
    type: {
      region: String,
      city: String,
      street: String,
      house: String,
      index: String,
    },
    required: true,
  })
  delivery: Delivery;
  @Prop()
  orderHistory: string[];
  @Prop()
  activeAccoung: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
