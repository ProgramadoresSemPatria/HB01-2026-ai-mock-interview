import type { Transporter } from "nodemailer";
import { describe, expect, it, vi } from "vitest";

import { NodemailerMailerAdapter } from "./nodemailer-mailer-adapter";

describe("NodemailerMailerAdapter", () => {
  it("send delegates to the transport with from, to, subject and text body", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });
    const transport = { sendMail } as unknown as Transporter;
    const mailer = new NodemailerMailerAdapter(transport, {
      mailFrom: "noreply@example.com",
    });

    await mailer.send("user@example.com", "Reset password", "Click the link");

    expect(sendMail).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Reset password",
      text: "Click the link",
    });
  });

  it("send propagates transport errors", async () => {
    const sendMail = vi
      .fn()
      .mockRejectedValue(new Error("SMTP connection failed"));
    const transport = { sendMail } as unknown as Transporter;
    const mailer = new NodemailerMailerAdapter(transport, {
      mailFrom: "noreply@example.com",
    });

    await expect(
      mailer.send("user@example.com", "Subject", "Body"),
    ).rejects.toThrow("SMTP connection failed");
  });
});
