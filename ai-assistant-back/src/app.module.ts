import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Auth & Users Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MailModule } from './modules/mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { User } from './modules/users/user.entity';

// Assistant Modules
import { QaModule } from './qa/qa.module';
import { DocsModule } from './docs/docs.module';
import { EmailsModule } from './emails/emails.module';
import { HealthModule } from './health/health.module';
import { StatsModule } from './stats/stats.module';
import { AiModule } from './modules/ai/ai.module';

import appConfig from './config/app.config';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),

    // Base de données PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST', 'localhost');
        const port = config.get<number>('DB_PORT', 5432);
        console.log(`Connecting to DB at ${host}:${port} as ${config.get('DB_USERNAME')}`);
        return {
          type: 'postgres',
          host,
          port,
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'postgres'),
          database: config.get<string>('DB_DATABASE', 'unihelp'),
          entities: [User],
          autoLoadEntities: true,
          synchronize: true,
          logging: config.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),

    // Rate Limiting (Anti-Brute Force)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 15, // Limite globale ajustable
      },
    ]),

    // Authentication & Support
    MailModule,
    UsersModule,
    AuthModule,
    AdminModule,

    // Fonctionnalités RAG & Assistant
    QaModule,
    DocsModule,
    AiModule,
    EmailsModule,
    HealthModule,
    StatsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
