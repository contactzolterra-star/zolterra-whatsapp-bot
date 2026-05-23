const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Zolterra WhatsApp Bot Running");
});

app.get("/webhook", (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
