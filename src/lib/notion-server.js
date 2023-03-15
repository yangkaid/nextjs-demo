import { Client } from "@notionhq/client";
const auth = process.env.NOTION_ACCESS_TOKEN;
const database = process.env.NOTION_DATABASE_ID;
const transform = (data) => {
  
}
export default class NotionServer{
  constructor(){
    this.client = new Client({ auth });
  }
  async getPosts(){
    const response = await this.client.databases.query({
      database_id: database,
    });
    return response.results;
  }
  async getPost(id){
    const response = await this.client.pages.retrieve({
      page_id: id,
    });
    return response;
  }
  async createPost(title, content){
    const response = await this.client.pages.create({
      parent: {
        database_id: database,
      },
      properties: {
        title: {
          title: [
            {
              type: "text",
              text: {
                content: title,
              },
            },
          ],
        },
        content: {
          rich_text: [
            {
              type: "text",
              text: {
                content: content,
              },
            },
          ],
        },
      },
    });
    return response;
  }
  async updatePost(id, title, content){
    const response = await this.client.pages.update({
      page_id: id,
      properties: {
        title: {
          title: [
            {
              type: "text",
              text: {
                content: title,
              },
            },
          ],
        },
        content: {
          rich_text: [
            {
              type: "text",
              text: {
                content: content,
              },
            },
          ],
        },
      },
    });
    return response;
  }
  async deletePost(id){
    const response = await this.client.pages.update({
      page_id: id,
      archived: true,
    });
    return response;
  }
}
