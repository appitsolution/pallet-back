import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { User, UserSchema } from './database/user/user.schema';
import {
  CheckPhone,
  CheckPhoneSchema,
} from './database/user/check-phone.schema';
import {
  ResetPassword,
  ResetPasswordSchema,
} from './database/user/reset-password.schema';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CheckPhone.name, schema: CheckPhoneSchema },
      { name: ResetPassword.name, schema: ResetPasswordSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}
