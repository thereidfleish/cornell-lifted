export interface BlogPostSummary {
  id: string;
  title: string;
  date: string;
  coverImageUrl: string;
}

export interface BlogHeaderSection {
  type: "header";
  text: string;
}

export interface BlogParagraphSection {
  type: "paragraph";
  text: string;
}

export interface BlogImageSection {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}

export interface BlogListSection {
  type: "list";
  items: string[];
}

export type BlogSection = BlogHeaderSection | BlogParagraphSection | BlogImageSection | BlogListSection;

export interface BlogPost extends BlogPostSummary {
  body: BlogSection[];
}
