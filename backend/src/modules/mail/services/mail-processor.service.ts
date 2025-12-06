import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Worker } from "bullmq";
import { SendMailDto } from "../dtos/request/send-mail.dto";
import * as nodemailer from "nodemailer";
import * as fs from "node:fs";
import * as path from "node:path";
import Handlebars from "handlebars";

function getRedisConnection() {
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
  };
}

@Injectable()
export class MailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter?: nodemailer.Transporter;
  private template?: Handlebars.TemplateDelegate;
  private worker?: Worker<SendMailDto>;

  async onModuleInit() {
    this.logger.log("Starting mail queue processor (BullMQ + Redis)");

    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: process.env.MAIL_SECURE === "true",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const templatePath = path.join(__dirname, "..", "templates", "basic.hbs");
    try {
      const content = fs.readFileSync(templatePath, "utf8");
      this.template = Handlebars.compile(content);
      this.logger.log(`Loaded mail template from ${templatePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to load mail template at ${templatePath}: ${(error as Error).message}`,
      );
    }

    // Tạo worker BullMQ để lắng nghe và xử lý các job mail trong Redis
    this.worker = new Worker<SendMailDto>(
      "mail",
      async (job) => {
        await this.processJob(job.data, job.id);
      },
      {
        connection: getRedisConnection(),
      },
    );

    this.worker.on("completed", (job) => {
      this.logger.log(`Mail job #${job.id} processed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      this.logger.error(`Mail job #${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(dto: SendMailDto, jobId?: string | number | null): Promise<void> {
    if (!this.transporter) {
      this.logger.error("Mail transporter is not initialized");
      return;
    }

    if (!this.template) {
      this.logger.error("Mail template is not initialized");
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: dto.to,
        subject: dto.subject,
        text: dto.body,
        html: this.renderHtmlTemplate(dto),
      });

      this.logger.log(
        `Sent email to ${dto.to} with subject "${dto.subject}" (job #${jobId ?? "n/a"})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${dto.to} (job #${jobId ?? "n/a"}): ${(error as Error).message}`,
      );
    }
  }

  private renderHtmlTemplate(dto: SendMailDto): string {
    if (!this.template) {
      return dto.body;
    }

    const appName = process.env.APP_NAME ?? "Our Music App";
    const appUrl = process.env.APP_URL ?? "#";

    const year = new Date().getFullYear();

    return this.template({
      SUBJECT: dto.subject,
      APP_NAME: appName,
      APP_URL: appUrl,
      BODY: dto.body.replace(/\n/g, "<br />"),
      YEAR: year,
    });
  }
}
