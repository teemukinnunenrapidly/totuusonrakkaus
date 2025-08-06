"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import YouTube from '@tiptap/extension-youtube';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube,
  Undo,
  Redo
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
      {/* Perustoiminnot */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Lihavoitu"
      >
        <Bold className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Kursiivi"
      >
        <Italic className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Otsikot */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Otsikko 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Otsikko 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Listat */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Luettelo"
      >
        <List className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Numeroitu luettelo"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Lainaus */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Lainaus"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Linkki */}
      <button
        onClick={() => {
          const url = window.prompt('Syötä URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Lisää linkki"
      >
        <LinkIcon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Peruuta/Toista */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50"
        title="Peruuta"
      >
        <Undo className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50"
        title="Toista"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder, disabled = false }: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      YouTube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video',
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!isClient) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Ladataan editoria...</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
} 