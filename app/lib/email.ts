import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "olaf-dg",
  key: process.env.MAILGUN_API_KEY!,
});

export const sendEmail = async ({
  to,
  subject,
  text,
  html = text,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> => {
  try {
    await mg.messages.create("mg.olafdg.org", {
      from: "Olaf DG<noreply@olafdg.org>",
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error(error);
  }
};
