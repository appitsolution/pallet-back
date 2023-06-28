export interface loginTypes {
  login: string;
  password: string;
}

export interface changeData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
  orderHistory: string[];
}

export interface changeDelivery {
  id: string;
  region: string;
  city: string;
  street: string;
  house: string;
  index: string;
}

export interface changePassword {
  id: string;
  currentPassword: string;
  newPassword: string;
}

export interface orderData {
  id: string; //Ид заказа
  idUser: string; //Ид пользователя
  statusOrder: string; // Статус заказа
  city: string; //Город заказа
  delivery: string; //Способ доставки
  address?: string; // Адресс склада
  storehouse?: string;
  paymentSelect: string; //Способ оплаты
  dateSend: string; //Дата отправки
  dateCreate: string; //Дата создания заказа
  products: []; //Список товаров
  againData: any;
}

export interface acceptPhoneData {
  phone: string;
  code: string;
}

export interface Bonus {
  bonusScore: string;
  bonusHistory: BonusHistory[];
  bonusNotActive: BonusNotActive[];
}

export interface BonusHistory {
  id: string;
  idUser: string;
  title: 'Реферальна програма' | 'Поставка' | 'Замовлення' | string; // Назва
  date: string; // Дата
  order: string; // Сума замовленя
  bonus: string; // Бонуси "+/-300"
  bonusType: 'minus' | 'plus'; // Тип бонус
  type: 'default' | 'referral' | 'delivery' | 'order';
}

export interface BonusNotActive {
  id: string;
  idUser: string;
  title: 'Реферальна програма' | 'Поставка' | 'Замовлення' | string; // Назва
  date: string; // Дата
  order: string; // Сума замовленя
  bonus: string; // Бонуси "+/-300"
  bonusType: 'minus' | 'plus'; // Тип бонус
  type: 'default' | 'referral' | 'delivery' | 'order';
}
