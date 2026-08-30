import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: SESClient | null;
  private readonly fromEmail: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.fromEmail = this.configService.get<string>('SES_FROM_EMAIL');

    if (region && accessKeyId && secretAccessKey && this.fromEmail) {
      this.client = new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });
    } else {
      this.client = null;
      this.logger.warn('AWS SES is not configured (missing AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / SES_FROM_EMAIL) — email sending is disabled.');
    }
  }

  /** Lets callers fail gracefully (e.g. 503) instead of crashing when SES isn't set up yet. */
  isConfigured(): boolean {
    return this.client !== null;
  }

  async sendHtmlEmail(to: string, subject: string, html: string, text: string): Promise<void> {
    if (!this.client || !this.fromEmail) {
      throw new Error('Email service is not configured.');
    }
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    });
    await this.client.send(command);
  }
}
