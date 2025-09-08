import ErrorPage from "./error";

// Next.js App Router custom 404 page
export default function NotFound() {
  return (
    <ErrorPage
      error_code={404}
      error_message_title="Not Found"
      error_message_body="The page you are looking for does not exist."
      error_message_human_body="In other words, this page or Lifted message just simply does not exist. Not sure how you ended up here, but you probably did something wrong. Or sneaky, like trying to increase the number in the URL to see if you had extra Lifted messages. Or maybe it was our fault and you're missing messages. Idk. Send us an email below if you're not sure and we'll check it out!"
    />
  );
}
