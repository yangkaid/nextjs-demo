import NotionServer from "@/lib/notion-server"
const notionServer = new NotionServer()

export default async function handler(req, res) {
  const data = await notionServer.createPost(req.body)
  res.status(200).json(data)
}
