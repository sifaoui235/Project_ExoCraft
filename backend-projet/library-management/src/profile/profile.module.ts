import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
