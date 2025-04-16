import axios from "axios";

const smsParams = {
  region: process.env.SINCH_REGION,
  servicePlanId: process.env.SINCH_SERVICE_PLAN_ID,
  apiToken: process.env.SINCH_API_TOKEN,
  url: `https://${process.env.SINCH_REGION}.sms.api.sinch.com/xms/v1/${process.env.SINCH_SERVICE_PLAN_ID}/batches`,
  from: process.env.SINCH_PHONE_NUMBER,
};

const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer " + smsParams.apiToken,
};

const allowedNumbers = [process.env.MY_PHONE_NUMBER];

export const sendSMS = (
  to: string,
  body: string
): Promise<{ status: number; [key: string]: unknown }> => {
  if (!allowedNumbers.includes(to)) {
    throw new Error("SMS failed: this number is not allowed");
  }
  if (!body || body.length === 0) {
    throw new Error("SMS failed: no body provided");
  }

  const payload = JSON.stringify({
    from: smsParams.from,
    to: ["+1" + to],
    body,
  });

  return axios.post(smsParams.url, payload, { headers });
};
