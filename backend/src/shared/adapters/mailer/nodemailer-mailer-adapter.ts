import type { IMailer } from "@/modules/auth/protocols/mailer";
import type { Transporter } from "nodemailer";

export type NodemailerMailerConfig = {
  mailFrom: string;
};

export class NodemailerMailerAdapter implements IMailer {
  constructor(
    private readonly transport: Transporter,
    private readonly config: NodemailerMailerConfig,
  ) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    await this.transport.sendMail({
      from: this.config.mailFrom,
      to,
      subject,
      text: body,
    });
  }
}

/** Explicit transport + mailFrom required — SMTP env removed with local auth. */
export function createNodemailerMailerAdapter(
  transport: Transporter,
  config: NodemailerMailerConfig,
): IMailer {
  return new NodemailerMailerAdapter(transport, config);
}
