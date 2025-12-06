import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { SendMailDto } from "../dtos/request/send-mail.dto";

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

  constructor() {
    this.queue = new Queue<SendMailDto>("mail", {
      connection: getRedisConnection(),
    });
  }

  async enqueueMail(dto: SendMailDto) {
    const job = await this.queue.add("send-mail", dto);
    this.logger.log(`Queued mail job #${job.id} to ${dto.to}`);
    return { jobId: job.id };
  }
}
