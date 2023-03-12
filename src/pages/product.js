export default function Product({ product }) {
  return (
    <div>
      <h1>123123123</h1>
      <p>{product[0].body}</p>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  console.log(params)
  // Fetch data from an API or CMS
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts`);
  const product = await res.json();

  return {
    props: {
      product,
    },
  };
}
