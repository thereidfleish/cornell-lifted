import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPostById } from "@/data/blogPosts";

interface BlogPostPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ id: post.id }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params;
  const post = getBlogPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4fbf3] py-10 px-4">
      <article className="max-w-3xl mx-auto bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <img
          src={post.coverImageUrl}
          alt={`${post.title} cover image`}
          className="w-full h-72 object-cover"
        />

        <div className="p-6 sm:p-8">
          <Link href="/blog" className="text-cornell-blue hover:underline text-sm">
            ← Back to all posts
          </Link>
          <p className="text-sm text-gray-500 mt-4">{post.date}</p>
          <h1 className="text-3xl font-bold mt-2 mb-6 text-gray-900">{post.title}</h1>

          <style>{`.prose a { text-decoration: underline; text-decoration-color: #b31b1b; }`}</style>
          <div className="prose prose-sm max-w-none space-y-5">
            {post.body.map((section, index) => {
              if (section.type === "header") {
                return (
                  <h2 key={`${post.id}-section-${index}`} className="text-2xl font-semibold text-gray-900">
                    {section.text}
                  </h2>
                );
              }

              if (section.type === "paragraph") {
                return (
                  <p
                    key={`${post.id}-section-${index}`}
                    className="text-gray-700 leading-8"
                    dangerouslySetInnerHTML={{ __html: section.text }}
                  />
                );
              }

              if (section.type === "list") {
                return (
                  <ul key={`${post.id}-section-${index}`} className="list-disc pl-6 text-gray-700 space-y-2 leading-7">
                    {section.items.map((item, itemIndex) => (
                      <li key={`${post.id}-section-${index}-item-${itemIndex}`} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                );
              }

              return (
                <figure key={`${post.id}-section-${index}`}>
                  <img
                    src={section.src}
                    alt={section.alt}
                    className="w-full rounded-lg border border-gray-100"
                  />
                  {section.caption && (
                    <figcaption className="text-sm text-gray-500 mt-2">{section.caption}</figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </div>
      </article>
    </main>
  );
}
