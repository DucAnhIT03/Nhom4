import { Module } from "@nestjs/common";
import { MailController } from "./controllers/mail.controller";
import { MailService } from "./services/mail.service";
import { MailProcessor } from "./services/mail-processor.service";

@Module({
  imports: [],
  controllers: [MailController],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
