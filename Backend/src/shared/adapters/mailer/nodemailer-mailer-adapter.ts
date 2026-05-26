import type { IMailer } from "@/modules/auth/protocols/mailer";
import { createRequire } from "node:module";
import nodemailer, { type Transporter } from "nodemailer";

const require = createRequire(import.meta.url);

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

type EnvServerMailerModule = {
  env: {
    MAIL_FROM: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
  };
};

function readEnvMailerConfig(): NodemailerMailerConfig & {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
} {
  const { env } = require("@/config/env") as EnvServerMailerModule;

  return {
    mailFrom: env.MAIL_FROM,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  };
}

export function createNodemailerMailerAdapter(
  transport?: Transporter,
  config?: Partial<NodemailerMailerConfig>,
): IMailer {
  if (transport && config?.mailFrom) {
    return new NodemailerMailerAdapter(transport, {
      mailFrom: config.mailFrom,
    });
  }

  const fromEnv = readEnvMailerConfig();

  return new NodemailerMailerAdapter(
    transport ??
      nodemailer.createTransport({
        host: fromEnv.smtp.host,
        port: fromEnv.smtp.port,
        auth: {
          user: fromEnv.smtp.user,
          pass: fromEnv.smtp.pass,
        },
      }),
    {
      mailFrom: config?.mailFrom ?? fromEnv.mailFrom,
    },
  );
}
