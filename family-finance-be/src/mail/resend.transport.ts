import { Resend } from 'resend';

/**
 * Custom Nodemailer transport that sends emails via Resend HTTP API.
 * This bypasses SMTP port blocking on platforms like Render free tier.
 */
export function createResendTransport(apiKey: string) {
  const resend = new Resend(apiKey);

  return {
    name: 'resend',
    version: '1.0.0',
    send(
      mail: { data: Record<string, any> },
      callback: (err: Error | null, info?: any) => void,
    ) {
      const { from, to, subject, html, text } = mail.data;

      // Normalize "from" field
      let fromStr: string;
      if (typeof from === 'string') {
        fromStr = from;
      } else if (from?.address) {
        fromStr = from.name
          ? `${from.name} <${from.address}>`
          : from.address;
      } else {
        fromStr = 'Gia Kế <onboarding@resend.dev>';
      }

      // Normalize "to" field
      const toArr: string[] = (Array.isArray(to) ? to : [to]).map(
        (t: any) => (typeof t === 'string' ? t : t?.address || t),
      );

      resend.emails
        .send({
          from: fromStr,
          to: toArr,
          subject: subject || '(no subject)',
          html: html || undefined,
          text: text || undefined,
        })
        .then((result) => {
          callback(null, {
            messageId: result.data?.id || 'resend-ok',
            accepted: toArr,
          });
        })
        .catch((err) => {
          callback(err instanceof Error ? err : new Error(String(err)));
        });
    },
  };
}
