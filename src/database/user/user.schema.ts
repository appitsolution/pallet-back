import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type Delivery = {
  region: string;
  city: string;
  street: string;
  house: string;
  index: string;
};

type BonusHistory = {
  id: String;
  idUser: String;
  title: 'Реферальна програма' | 'Поставка' | 'Замовлення' | string; // Назва
  date: String; // Дата
  order: String; // Сума замовленя
  bonus: String; // Бонуси "+/-300"
  bonusType: 'minus' | 'plus'; // Тип бонус
  type: 'default' | 'referral' | 'delivery' | 'order';
};

type BonusNotActive = {
  id: String;
  idUser: String;
  title: 'Реферальна програма' | 'Поставка' | 'Замовлення' | string; // Назва
  date: String; // Дата
  order: String; // Сума замовленя
  bonus: String; // Бонуси "+/-300"
  bonusType: 'minus' | 'plus'; // Тип бонус
  type: 'default' | 'referral' | 'delivery' | 'order';
};

type Bonus = {
  bonusScore: string;
  bonusHistory: BonusHistory[];
  bonusNotActive: BonusNotActive[];
  startBonusDate: string;
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
  activeAccount: boolean;
  @Prop({
    type: {
      bonusScore: String,
      bonusHistory: [],
      bonusNotActive: [],
      startBonusDate: String,
    },
    default: {
      bonusScore: '0',
      bonusHistory: [],
      bonusNotActive: [],
      startBonusDate: '',
    },
  })
  bonus: {
    bonusScore: String;
    bonusHistory: BonusHistory[];
    bonusNotActive: BonusNotActive[];
    startBonusDate: String;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
