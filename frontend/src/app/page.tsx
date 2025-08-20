import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
  return (
    <a
      href={`https://www.cornelllifted.com/login?next=/`}
      className="inline-block px-6 py-3 bg-red-600 text-white text-lg font-semibold rounded shadow hover:bg-red-700 transition-colors"
    >
      Sign In with Cornell NetID
    </a>
  );
}
