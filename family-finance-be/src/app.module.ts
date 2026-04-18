import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './Module/users/users.module';
import { BudgetModule } from './Module/budget/budget.module';
import { SpaceModule } from './Module/space/space.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthsModule } from '@/Module/auths/auths.module';
import { AccountModule } from '@/Module/account/account.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { JwtAuthGuard } from '@/Module/auths/passport/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { CategorisModule } from '@/Module/categoris/categoris.module';
import { IncomesModule } from '@/Module/incomes/incomes.module';
import { ExpensesModule } from '@/Module/expenses/expenses.module';
import { DashboardModule } from './Module/dashboard/dashboard.module';
import { NotificationModule } from './Module/notification/notification.module';

@Module({
  imports: [
    UsersModule,
    BudgetModule,
    SpaceModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: '"Family Financial Management" <no-reply@localhost>',
        },
        // preview: true,
        template: {
          dir: process.cwd() + '/src/mail/templates/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    AuthsModule,
    AccountModule,
    CategorisModule,
    IncomesModule,
    ExpensesModule,
    DashboardModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
