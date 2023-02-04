import { useRouter } from "next/router"

function Post() {
  const router = useRouter()
  return <div>我是第{router.query.id}篇文章</div>
}
export default Post
