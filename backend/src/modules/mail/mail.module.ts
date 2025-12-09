import { Module, forwardRef } from "@nestjs/common";
import { MailController } from "./controllers/mail.controller";
import { MailService } from "./services/mail.service";
import { MailProcessor } from "./services/mail-processor.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [MailController],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
