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
import { AiModule } from './Module/ai/ai.module';
import { TagsModule } from './Module/tags/tags.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GoalsModule } from './Module/goals/goals.module';
import { createResendTransport } from './mail/resend.transport';
import { createBrevoTransport } from './mail/brevo.transport';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
      useFactory: async (configService: ConfigService) => {
        const brevoApiKey = configService.get<string>('BREVO_API_KEY');
        const resendApiKey = configService.get<string>('RESEND_API_KEY');
        const mailUser =
          configService.get<string>('MAIL_USER') || 'noreply@giake.app';

        const templateConfig = {
          dir: process.cwd() + '/src/mail/templates/',
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        };

        // Ưu tiên 1: Brevo HTTP API (300 email/ngày, không cần domain)
        if (brevoApiKey) {
          console.log('[Mail] Using Brevo HTTP API transport');
          return {
            transport: createBrevoTransport(brevoApiKey, mailUser) as any,
            defaults: { from: `"Gia Kế" <${mailUser}>` },
            template: templateConfig,
          };
        }

        // Ưu tiên 2: Resend HTTP API
        if (resendApiKey) {
          console.log('[Mail] Using Resend HTTP API transport');
          return {
            transport: createResendTransport(resendApiKey) as any,
            defaults: { from: '"Gia Kế" <onboarding@resend.dev>' },
            template: templateConfig,
          };
        }

        // Fallback: Gmail SMTP (chỉ hoạt động ở localhost)
        console.log('[Mail] Using Gmail SMTP transport (local only)');
        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            family: 4,
            auth: {
              user: mailUser,
              pass: configService.get<string>('MAIL_PASS'),
            },
          },
          defaults: { from: '"Gia Kế" <no-reply@localhost>' },
          template: templateConfig,
        };
      },
      inject: [ConfigService],
    }),
    AuthsModule,
    AccountModule,
    CategorisModule,
    IncomesModule,
    ExpensesModule,
    DashboardModule,
    NotificationModule,
    AiModule,
    TagsModule,
    GoalsModule,
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
