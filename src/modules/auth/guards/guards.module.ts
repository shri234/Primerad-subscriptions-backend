import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from './auth.guard';
import { OptionalAuthGuard } from './optional-auth.guard';
import { SessionAccessGuard } from './session-access.guard';
import { UserSchema } from '../../user/schema/user.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  providers: [AuthGuard, OptionalAuthGuard, SessionAccessGuard],
  exports: [AuthGuard, OptionalAuthGuard, SessionAccessGuard],
})
export class GuardsModule {}
