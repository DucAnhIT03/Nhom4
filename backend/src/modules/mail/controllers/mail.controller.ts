import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { MailService } from "../services/mail.service";
import { SendMailDto } from "../dtos/request/send-mail.dto";
import { SendBulkMailDto } from "../dtos/request/send-bulk-mail.dto";

@ApiTags("Gửi email")
@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @ApiOperation({ summary: "Đưa yêu cầu gửi email vào hàng đợi" })
  @Post("queue")
  queueMail(@Body() dto: SendMailDto) {
    return this.mailService.enqueueMail(dto);
  }

  @ApiOperation({ summary: "Gửi email cho nhiều user hoặc tất cả user" })
  @Post("bulk")
  queueBulkMail(@Body() dto: SendBulkMailDto) {
    return this.mailService.enqueueBulkMail(dto);
  }
}
