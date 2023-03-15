// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  let { message } = req.body
  console.log(message)
  res.status(200).json({ name: message })
}
