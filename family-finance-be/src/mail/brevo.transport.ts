/**
 * Custom Nodemailer transport that sends emails via Brevo (Sendinblue) HTTP API.
 * This bypasses SMTP port blocking on platforms like Render free tier.
 *
 * Brevo free tier: 300 emails/day, no domain verification needed.
 * @param apiKey - Brevo API key
 * @param verifiedEmail - The sender email verified on Brevo dashboard
 */
export function createBrevoTransport(apiKey: string, verifiedEmail: string) {
  return {
    name: 'brevo',
    version: '1.0.0',
    send(
      mail: { data: Record<string, any> },
      callback: (err: Error | null, info?: any) => void,
    ) {
      const { from, to, subject, html, text } = mail.data;

      // Luôn dùng email đã verify trên Brevo làm sender
      const senderEmail = verifiedEmail;
      let senderName = 'Gia Kế';

      // Lấy tên từ "from" nếu có
      if (typeof from === 'string') {
        const match = from.match(/"?([^"<]*)"?\s*</);
        if (match) senderName = match[1].trim();
      } else if (from?.name) {
        senderName = from.name;
      }

      // Normalize "to" field — Brevo expects [{email, name}]
      const toArr: { email: string; name?: string }[] = (
        Array.isArray(to) ? to : [to]
      ).map((t: any) => {
        if (typeof t === 'string') return { email: t };
        return { email: t.address || t.email || t, name: t.name };
      });

      console.log(
        `[Brevo] Sending email from: ${senderName} <${senderEmail}> to: ${toArr.map((t) => t.email).join(', ')}`,
      );

      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: toArr,
          subject: subject || '(no subject)',
          htmlContent: html || undefined,
          textContent: text || undefined,
        }),
      })
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg =
              (body as any).message || `Brevo API error: ${res.status}`;
            console.error('[Brevo] Send failed:', msg);
            throw new Error(msg);
          }
          callback(null, {
            messageId: (body as any).messageId || 'brevo-ok',
            accepted: toArr.map((t) => t.email),
          });
        })
        .catch((err) => {
          callback(err instanceof Error ? err : new Error(String(err)));
        });
    },
  };
}
