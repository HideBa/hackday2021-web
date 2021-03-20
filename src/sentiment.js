// Imports the Google Cloud client library
import axios from "axios";

// Creates a client
const API_KEY = process.env.VUE_APP_GOOGLE_NLP_KEY;

var URL = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${API_KEY}`;

const getSentiment = async (text) => {
  const data = await axios
    .post(URL, {
      document: {
        type: "PLAIN_TEXT",
        content: text,
      },
    })
    .then((res) => {
      return res.data.documentSentiment;
    })
    .catch((err) => {
      console.error(err);
      return undefined;
    });
  return data;
};

export default getSentiment;
