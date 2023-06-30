import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResetPasswordDocument = ResetPassword & Document;
@Schema()
export class ResetPassword {
  @Prop()
  phone: string;
  @Prop()
  password: string;
}

export const ResetPasswordSchema = SchemaFactory.createForClass(ResetPassword);
