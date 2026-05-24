const express = require("express");
const axios = require("axios");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME;

const pendingVisits = new Set();

const TRIGGER_PHRASE =
  "hello, i'm interested in your project. please share complete details.";

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets"
    ]
  });

  return google.sheets({
    version: "v4",
    auth
  });
}

app.get("/", (req, res) => {
  res.send("Zolterra WhatsApp Bot Running");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

async function sendMainButtons(to) {
  await axios.post(
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text:
            "Greetings from Zolterra\n\n" +
            "Thank you for contacting us.\n" +
            "We are pleased to assist you.\n\n" +
            "Please choose an option:"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "project_details",
                title: "Project Details"
              }
            },
            {
              type: "reply",
              reply: {
                id: "schedule_visit",
                title: "Schedule Visit"
              }
            },
            {
              type: "reply",
              reply: {
                id: "call_us",
                title: "Call Us"
              }
            }
          ]
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}
async function sendProjectDetails(to) {
  await axios.post(
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text:
            "EXOTICA ISLAND\n\n" +
            "Location: Indore Bypass, Behind Phoenix Citadel Mall\n\n" +
            "Map Location:\nhttps://maps.app.goo.gl/AwEimhm9Jhha9xTMA\n\n" +
            "A thoughtfully planned plotted development offering excellent connectivity, modern infrastructure, and strong long-term appreciation potential.\n\n" +
            "Limited Period Offer:\nFree Registry available on selected inventory.\nTerms & Conditions apply.\n\n" +
            "Project Amenities:\n• Swimming Pool\n• Clubhouse\n• Gymnasium\n• Community Hall\n• 24×7 Security\n\n" +
            "Investment Details:\nUnit Sizes: 420 Sq.Ft. to 1450 Sq.Ft.\n\n" +
            "Net Rate:\n₹4,551 per Sq.Ft.\n\n" +
            "Additional Charges:\n• ₹150 per Sq.Ft. towards Clubhouse & Electrical Infrastructure\n• Maintenance Charges applicable for 2 years\n\n" +
            "Brochure:\nhttps://drive.google.com/file/d/1hpydIoR1fAzBT_Q0qIWhikj3SbLMw6dK/view?usp=drivesdk"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "schedule_visit",
                title: "Schedule Visit"
              }
            },
            {
              type: "reply",
              reply: {
                id: "call_us",
                title: "Call Us"
              }
            }
          ]
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function sendScheduleVisit(to) {
  await axios.post(
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body:
          "Thank you for your interest.\n\nPlease share your preferred date and time for the site visit.\n\nExample: 25 May, 5:00 PM"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function sendCallUs(to) {
  await axios.post(
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
       body:
  "Thank you for contacting Zolterra.\n\nFor further assistance, please contact:\n\nUmesh Sharma\n+91 8839212661"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    if (message.type === "text") {
  const text = (message.text?.body || "").toLowerCase().trim();

  if (pendingVisits.has(from)) {
    pendingVisits.delete(from);

    await axios.post(
      `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        type: "text",
        text: {
          body:
            "Thank you.\n\nYour site visit request has been received.\n\nWe will contact you shortly to confirm the appointment."
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.sendStatus(200);
  }

  if (text === TRIGGER_PHRASE) {
  await sendMainButtons(from);
  }
    }

    if (message.type === "interactive") {
      const buttonId =
        message.interactive?.button_reply?.id;

      if (buttonId === "project_details") {
        await sendProjectDetails(from);
      }

      if (buttonId === "schedule_visit") {
  pendingVisits.add(from);
  await sendScheduleVisit(from);
      }

      if (buttonId === "call_us") {
        await sendCallUs(from);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(
      error?.response?.data || error.message
    );
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

