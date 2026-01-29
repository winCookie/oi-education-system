import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface Heading {
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    // 提取Markdown标题
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));
    
    const extractedHeadings: Heading[] = matches.map((match) => {
      const level = match[1].length;
      const text = match[2].trim();
      return { text, level };
    });

    setHeadings(extractedHeadings);
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <List className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">目录</h2>
      </div>
      <nav className="space-y-1">
        {headings.map((heading, index) => (
          <div
            key={index}
            className="block w-full text-left py-1.5 px-2 rounded text-sm text-gray-600"
            style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
          >
            {heading.text}
          </div>
        ))}
      </nav>
    </div>
  );
};
