import React, { useRef, useEffect, useState } from 'react';
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Lightbulb,
  Minus,
  Image as ImageIcon,
  Eye,
  Code,
  PenTool,
  RotateCcw,
  Check
} from 'lucide-react';

interface VisualEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your health article paragraphs here...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'preview' | 'html'>('visual');
  const [htmlSource, setHtmlSource] = useState(value);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Sync value into contenteditable when value changes externally (e.g. switching articles or resetting)
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setHtmlSource(value || '');
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlSource(html);
      onChange(html);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleFormatHeading = (tag: 'h2' | 'h3' | 'p') => {
    executeCommand('formatBlock', `<${tag}>`);
  };

  const insertCustomHTML = (htmlToInsert: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, htmlToInsert);
      handleInput();
    }
  };

  const insertCalloutBox = () => {
    insertCustomHTML(`
      <div class="callout-box">
        <p class="font-semibold text-emerald-800">Key Health Takeaway:</p>
        <p>Write your essential clinical finding, actionable advice, or medical insight here...</p>
      </div>
      <p><br></p>
    `);
  };

  const insertQuote = () => {
    insertCustomHTML(`
      <blockquote>"Enter an inspiring quote or clinical observation here." — Specialist Name, MD</blockquote>
      <p><br></p>
    `);
  };

  const insertDivider = () => {
    insertCustomHTML('<hr class="my-6 border-emerald-100" /><p><br></p>');
  };

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    const captionHtml = imageCaption
      ? `<figcaption class="text-xs text-center text-slate-500 mt-2 italic">${imageCaption}</figcaption>`
      : '';
    const imgHtml = `
      <figure class="my-6 text-center">
        <img src="${imageUrl.trim()}" alt="${imageCaption || 'Health illustration'}" class="rounded-2xl max-w-full mx-auto shadow-sm" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;
    insertCustomHTML(imgHtml);
    setImageUrl('');
    setImageCaption('');
    setShowImageModal(false);
  };

  const handleHtmlSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setHtmlSource(newHtml);
    onChange(newHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = newHtml;
    }
  };

  return (
    <div className="border border-emerald-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
      {/* Editor Top Navigation & Tabs */}
      <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-100/50'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            <span>Visual Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-100/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Reader Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'html'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-100/50'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-600" />
            <span>HTML Code</span>
          </button>
        </div>

        <span className="text-[11px] text-emerald-800/70 font-medium">
          Format with 1 click without code
        </span>
      </div>

      {/* Visual Toolbar (Visible in Visual Mode) */}
      {activeTab === 'visual' && (
        <div className="bg-slate-50/80 border-b border-slate-200/80 p-2 flex flex-wrap items-center gap-1.5 text-slate-700">
          {/* Headings */}
          <button
            type="button"
            onClick={() => handleFormatHeading('h2')}
            title="Heading 2 (Major Section)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 hover:text-emerald-800 transition-colors bg-white border border-slate-200 shadow-xs cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
            <span>Heading 2</span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatHeading('h3')}
            title="Heading 3 (Sub-section)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 hover:text-emerald-800 transition-colors bg-white border border-slate-200 shadow-xs cursor-pointer"
          >
            <Heading3 className="w-3.5 h-3.5" />
            <span>Heading 3</span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatHeading('p')}
            title="Regular Paragraph"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 hover:text-emerald-800 transition-colors bg-white border border-slate-200 shadow-xs cursor-pointer"
          >
            Paragraph
          </button>

          <span className="h-5 w-px bg-slate-300 mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            title="Bold Text"
            className="p-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 hover:text-emerald-800 transition-colors bg-white border border-slate-200 shadow-xs cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('italic')}
            title="Italic Text"
            className="p-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 hover:text-emerald-800 transition-colors bg-white border border-slate-200 shadow-xs cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>

          <span className="h-5 w-px bg-slate-300 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            title="Bullet Points List"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-100 hover:text-emerald-800 transition-colors bg-white border border-slate-200 shadow-xs cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
            <span>Bullet List</span>
          </button>

          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            title="Numbered List"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-100 hover:text-emerald-800 transition-colors bg-white border border-slate-200 shadow-xs cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Numbered List</span>
          </button>

          <span className="h-5 w-px bg-slate-300 mx-1" />

          {/* Callouts & Elements */}
          <button
            type="button"
            onClick={insertCalloutBox}
            title="Insert Clinical Callout Box"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-100 bg-emerald-50 border border-emerald-200 shadow-xs transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span>Key Takeaway Box</span>
          </button>

          <button
            type="button"
            onClick={insertQuote}
            title="Insert Blockquote"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 hover:text-emerald-800 bg-white border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5 text-slate-500" />
            <span>Quote</span>
          </button>

          <button
            type="button"
            onClick={insertDivider}
            title="Insert Divider"
            className="p-1.5 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 bg-white border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            title="Insert Image inside content"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 hover:text-emerald-800 bg-white border border-slate-200 shadow-xs transition-colors cursor-pointer ml-auto"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Insert Image</span>
          </button>
        </div>
      )}

      {/* Main Editing Area */}
      {activeTab === 'visual' && (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="article-content min-h-[350px] max-h-[600px] overflow-y-auto p-6 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 text-slate-800"
          style={{ minHeight: '350px' }}
        />
      )}

      {activeTab === 'preview' && (
        <div className="p-6 min-h-[350px] max-h-[600px] overflow-y-auto bg-emerald-50/20">
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-emerald-100 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-4 border border-emerald-200">
              Visitor View Simulation
            </span>
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: htmlSource || '<p class="text-slate-400 italic">No content written yet.</p>' }}
            />
          </div>
        </div>
      )}

      {activeTab === 'html' && (
        <textarea
          value={htmlSource}
          onChange={handleHtmlSourceChange}
          placeholder="<h1>Direct HTML editor...</h1>"
          className="w-full min-h-[350px] p-4 font-mono text-xs text-slate-800 bg-slate-900 text-emerald-300 focus:outline-none"
        />
      )}

      {/* Insert Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-emerald-200 shadow-2xl space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-lg">
              Insert Image into Article Body
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Clinical illustration or photo description..."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={!imageUrl.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
