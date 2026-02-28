import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { AiModule } from '../modules/ai/ai.module';
import { MailModule } from '../modules/mail/mail.module';

@Module({
    imports: [AiModule, MailModule],
    controllers: [EmailsController],
    providers: [EmailsService],
})
export class EmailsModule { }
