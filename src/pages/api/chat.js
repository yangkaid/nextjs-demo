const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.CHATGPT_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  let { message } = req.body
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });
    let data = completion.data;
    res.status(200).json(data);
  } catch (error) {
    console.log(error)

  }
}
