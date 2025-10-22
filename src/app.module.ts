import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PathologyModule } from './modules/pathology/pathology.module';
import { ModuleModule } from './modules/module/module.module';
import { SessionModule } from './modules/sessions/session.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ObservationModule } from './modules/observations/observations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/your-database',
      }),
      inject: [ConfigService],
    }),

    PathologyModule,
    ModuleModule,
    SessionModule,
    AuthModule,
    PaymentModule,
    ObservationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
