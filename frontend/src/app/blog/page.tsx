"use client"

import Link from "next/link";
import { blogPostSummaries } from "@/data/blogPosts";
import { useGlobal } from "@/utils/GlobalContext";

export default function BlogIndexPage() {
  const { isWinter } = useGlobal();

  return (
    <main className={`${isWinter ? 'bg-[#e3eeff]' : 'bg-[#f4fbf3]'} font-tenor`}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-cornell-red font-schoolbell text-4xl mb-2 font-bold text-center">Lifted Blog</h2>
          <p className="text-lg text-center text-gray-700 mb-6">Updates, stories, and behind-the-scenes notes from the Lifted team.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {blogPostSummaries.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
            >
              <img
                src={post.coverImageUrl}
                alt={`${post.title} cover image`}
                className="h-48 w-full object-cover"
              />
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-2">{post.date}</p>
                <h2 className="text-xl font-semibold text-gray-900">{post.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
