import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CheckPhoneDocument = CheckPhone & Document;
@Schema()
export class CheckPhone {
  @Prop()
  phone: string;
  @Prop()
  code: string;
}

export const CheckPhoneSchema = SchemaFactory.createForClass(CheckPhone);
