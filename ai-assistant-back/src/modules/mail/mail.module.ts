import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';

@Global()
@Module({
    imports: [
        MailerModule.forRootAsync({
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get('SMTP_HOST'),
                    port: config.get<number>('SMTP_PORT'),
                    secure: config.get<number>('SMTP_PORT') === 465,
                    auth: {
                        user: config.get('SMTP_USER'),
                        pass: config.get('SMTP_PASS'),
                    },
                },
                defaults: {
                    from: `"UniHelp Support" <${config.get('SMTP_FROM')}>`,
                },
                template: {
                    dir: join(__dirname, 'templates'),
                    adapter: new EjsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
