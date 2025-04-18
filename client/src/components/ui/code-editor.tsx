import React from 'react';
import { Button } from '@/components/ui/button';
import { IssueHighlight } from '@/types';
import { AlignLeft, Wrench } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  filename: string;
  highlights?: IssueHighlight[];
  onFormat?: () => void;
  onAutoFix?: () => void;
}

export function CodeEditor({ code, filename, highlights = [], onFormat, onAutoFix }: CodeEditorProps) {
  // Function to create syntax highlighted code
  const createHighlightedCode = () => {
    // Split code into lines for line-by-line processing
    const lines = code.split('\n');
    
    return (
      <pre className="text-sm">
        {lines.map((line, lineIndex) => {
          const lineNum = lineIndex + 1;
          const lineHighlights = highlights.filter(h => h.line === lineNum);
          
          // If this line has no highlights, return it as is with basic syntax highlighting
          if (lineHighlights.length === 0) {
            return (
              <div key={lineNum} className="line">
                {highlightSyntax(line)}
              </div>
            );
          }
          
          // Process line with highlights
          let processedLine = [];
          let lastIndex = 0;
          
          // Sort highlights by startColumn
          const sortedHighlights = [...lineHighlights].sort((a, b) => 
            (a.startColumn || 0) - (b.startColumn || 0));
          
          for (const highlight of sortedHighlights) {
            const startCol = highlight.startColumn || 0;
            const endCol = highlight.endColumn || line.length;
            
            // Add text before the highlight
            if (startCol > lastIndex) {
              processedLine.push(
                <span key={`${lineNum}-${lastIndex}`}>
                  {highlightSyntax(line.substring(lastIndex, startCol))}
                </span>
              );
            }
            
            // Add the highlighted part
            processedLine.push(
              <span 
                key={`${lineNum}-${startCol}`} 
                className="error"
                title={highlight.message}
              >
                {highlightSyntax(line.substring(startCol, endCol))}
              </span>
            );
            
            lastIndex = endCol;
          }
          
          // Add any remaining text after the last highlight
          if (lastIndex < line.length) {
            processedLine.push(
              <span key={`${lineNum}-${lastIndex}`}>
                {highlightSyntax(line.substring(lastIndex))}
              </span>
            );
          }
          
          return <div key={lineNum} className="line">{processedLine}</div>;
        })}
      </pre>
    );
  };
  
  // Basic syntax highlighting function
  const highlightSyntax = (text: string) => {
    // This is a very simple implementation
    // In a real app, you'd use a library like Prism.js
    return text
      .replace(/\b(import|export|from|const|let|var|function|return|if|else|try|catch|finally|async|await|new|true|false|null|undefined)\b/g, 
        match => `<span class="keyword">${match}</span>`)
      .replace(/\b([A-Za-z]+)\(/g, 
        match => `<span class="function">${match}</span>`)
      .replace(/(["'`])(.*?)\1/g, 
        match => `<span class="string">${match}</span>`)
      .replace(/\/\/(.*?)($|<)/g, 
        (match, p1, p2) => `<span class="comment">//${p1}</span>${p2}`)
      .replace(/\/\*([\s\S]*?)\*\//g, 
        match => `<span class="comment">${match}</span>`);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-700">Code Editor</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center text-xs px-2 py-1" 
            onClick={onFormat}
          >
            <AlignLeft className="h-3 w-3 mr-1" />
            Format
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center text-xs px-2 py-1" 
            onClick={onAutoFix}
          >
            <Wrench className="h-3 w-3 mr-1" />
            Auto Fix
          </Button>
        </div>
      </div>
      
      <div 
        className="code-editor text-sm rounded-md"
        dangerouslySetInnerHTML={{ __html: createHighlightedCode().props.children.map((line: any) => {
          if (typeof line === 'string') return line;
          // Assuming line is a React element with props.children
          return line.props.children;
        }).join('\n') }}
        style={{
          fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: '1em',
          borderRadius: '4px',
          lineHeight: 1.5,
          overflowX: 'auto',
        }}
      />
      <style jsx>{`
        .code-editor .keyword { color: #569cd6; }
        .code-editor .function { color: #dcdcaa; }
        .code-editor .string { color: #ce9178; }
        .code-editor .comment { color: #6a9955; }
        .code-editor .error { 
          background-color: rgba(209, 52, 56, 0.2);
          text-decoration: wavy underline rgba(209, 52, 56, 1);
        }
      `}</style>
    </div>
  );
}
