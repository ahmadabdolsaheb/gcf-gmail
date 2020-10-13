const Auth = require("@google-cloud/express-oauth2-handlers");
const { google } = require("googleapis");
const gmail = google.gmail("v1");

const requiredScopes = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/spreadsheets",
];

const auth = Auth("datastore", requiredScopes, "email", true);

const setUpGmailPushNotifications = (email, pubsubTopic) => {
  const GCP_PROJECT = process.env.GCP_PROJECT;

  return gmail.users.watch({
    userId: email,
    requestBody: {
      labelIds: ["INBOX"],
      topicName: `projects/${GCP_PROJECT}/topics/${pubsubTopic}`,
    },
  });
};

exports.gmailCron2 = async () => {
  const EMAIL = process.env.EMAIL;
  const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC;

  try {
    await auth.auth.requireAuth(null, null, EMAIL);
  } catch (err) {
    console.log("An error has occurred in the auth process.");
    throw err;
  }
  const authClient = await auth.auth.authedUser.getClient();
  google.options({ auth: authClient });

  try {
    await setUpGmailPushNotifications(EMAIL, PUBSUB_TOPIC);
  } catch (err) {
    console.log(err);
    throw err;
  }
  console.log(`listening to ${EMAIL}`);
};
