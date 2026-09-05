import { BRAND, COLORS } from "@mamuy/shared";
import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY,
    },
  });

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    const from = process.env.MAIL_FROM ?? `${BRAND.name} <noreply@mamuy.dev>`;
    await this.transporter.sendMail({
      from,
      to: email,
      subject: `Reset your ${BRAND.name} password`,
      text: `Reset your password using this link:\n${resetUrl}\n\nThis link expires in 30 minutes and can be used once.\nIf you didn't request a reset, ignore this email.`,
      html: `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${COLORS.paper};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${COLORS.paper};padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #E2E8F0;">
            <tr>
              <td>
                <div style="font-size:20px;font-weight:700;color:${COLORS.primaryDark};">${BRAND.name}</div>
                <p style="color:${COLORS.ink};font-size:16px;line-height:1.5;">We received a request to reset your password.</p>
                <p style="padding:12px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background:${COLORS.primary};color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px;">Reset password</a>
                </p>
                <p style="color:#64748B;font-size:14px;">This link expires in 30 minutes and can be used once. If you didn't request a reset, ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    });
  }

  async sendOtp(email: string, otp: string) {
    const from = process.env.MAIL_FROM ?? `${BRAND.name} <noreply@mamuy.dev>`;
    await this.transporter.sendMail({
      from,
      to: email,
      subject: `${otp} is your ${BRAND.name} code`,
      text: `Your verification code is ${otp}\nIt expires in 10 minutes\nIf you didn't create an account, ignore this email`,
      html: `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${COLORS.paper};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${COLORS.paper};padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #E2E8F0;">
            <tr>
              <td>
                <div style="font-size:20px;font-weight:700;color:${COLORS.primaryDark};">${BRAND.name}</div>
                <p style="color:${COLORS.ink};font-size:16px;line-height:1.5;">Your verification code is</p>
                <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:${COLORS.primary};padding:12px 0;">${otp}</div>
                <p style="color:#64748B;font-size:14px;">This code expires in 10 minutes and can be used once.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    });
  }
}
