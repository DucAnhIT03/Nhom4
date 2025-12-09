import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { Queue } from "bullmq";
import { SendMailDto } from "../dtos/request/send-mail.dto";
import { SendBulkMailDto } from "../dtos/request/send-bulk-mail.dto";
import { UserService } from "../../user/user.service";

function getRedisConnection() {
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
  };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly queue: Queue<SendMailDto>;

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    this.queue = new Queue<SendMailDto>("mail", {
      connection: getRedisConnection(),
    });
  }

  async enqueueMail(dto: SendMailDto) {
    const job = await this.queue.add("send-mail", dto);
    this.logger.log(`Queued mail job #${job.id} to ${dto.to}`);
    return { jobId: job.id };
  }

  async enqueueBulkMail(dto: SendBulkMailDto) {
    const emails: string[] = [];

    // Nếu gửi cho tất cả user
    if (dto.sendToAll === "true") {
      const users = await this.userService.findAll({ page: 1, limit: 10000 });
      emails.push(...users.data.map((user) => user.email));
    } else if (dto.userIds && dto.userIds.length > 0) {
      // Nếu gửi cho danh sách user IDs
      const users = await Promise.all(
        dto.userIds.map((id) => this.userService.findOne(id).catch(() => null))
      );
      emails.push(...users.filter((u) => u !== null).map((u) => u!.email));
    } else if (dto.emails && dto.emails.length > 0) {
      // Nếu gửi cho danh sách email trực tiếp
      emails.push(...dto.emails);
    }

    // Loại bỏ email trùng lặp
    const uniqueEmails = [...new Set(emails)];

    if (uniqueEmails.length === 0) {
      throw new Error("No valid email addresses found");
    }

    // Thêm từng email vào queue
    const jobs = await Promise.all(
      uniqueEmails.map((email) =>
        this.queue.add("send-mail", {
          to: email,
          subject: dto.subject,
          body: dto.body,
        })
      )
    );

    this.logger.log(
      `Queued ${jobs.length} mail jobs with subject: ${dto.subject}`
    );

    return {
      totalEmails: uniqueEmails.length,
      jobIds: jobs.map((job) => job.id),
    };
  }
}
