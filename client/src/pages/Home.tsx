import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/ui/header';
import { Sidebar } from '@/components/ui/sidebar';
import { CodeEditor } from '@/components/ui/code-editor';
import { IssuesPanel } from '@/components/ui/issues-panel';
import { SidebarItem, Project, ProjectFile, FileIssue, IssueHighlight } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Save, Undo } from 'lucide-react';

// Mock data for initial development
const mockProjects: Project[] = [
  { id: 1, name: 'Sample Project', description: 'A sample React project' }
];

const mockFileStructure: SidebarItem[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      { id: 'app-js', name: 'App.js', path: 'src/App.js', type: 'file', hasErrors: true, isActive: true },
      { id: 'index-js', name: 'index.js', path: 'src/index.js', type: 'file' },
      { id: 'api-js', name: 'api.js', path: 'src/api.js', type: 'file', hasErrors: true }
    ]
  },
  {
    id: 'components',
    name: 'components',
    path: 'components',
    type: 'folder',
    children: [
      { id: 'header-js', name: 'Header.js', path: 'components/Header.js', type: 'file' },
      { id: 'dashboard-js', name: 'Dashboard.js', path: 'components/Dashboard.js', type: 'file', hasErrors: true }
    ]
  },
  { id: 'package-json', name: 'package.json', path: 'package.json', type: 'file' },
  { id: 'readme-md', name: 'README.md', path: 'README.md', type: 'file' }
];

const mockFileContent = `import React, { useState, useEffect } from 'react';
import { fetchData } from './api';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState(null); // Variable name mismatch

  useEffect(() => {
    const loadData = async() => {
      setLoading(true);
      try {
        const result = await fetchData();
        setData(result);
        setError(null); // Should be setErrors(null)
      } catch (err) {
        console.log(err); // Should use proper error handling
        setErrors(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="app-container">
      <Header title="My Dashboard" />
      {loading ? (
        <div className="loader">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <Dashboard data={data} />
      )}
    </div>
  );
}

export default App;`;

const mockIssues: FileIssue[] = [
  {
    id: 1,
    fileId: 1,
    line: 9,
    severity: 'high',
    message: 'State variable name mismatch',
    code: 'const [error, setErrors] = useState(null);',
    suggestion: 'const [error, setError] = useState(null);'
  },
  {
    id: 2,
    fileId: 1,
    line: 17,
    severity: 'medium',
    message: 'Incorrect setter function call',
    code: 'setError(null);',
    suggestion: 'setErrors(null);'
  },
  {
    id: 3,
    fileId: 1,
    line: 19,
    severity: 'low',
    message: 'Console logging in production',
    code: 'console.log(err);',
    suggestion: '// Use proper error handling or logging service'
  }
];

const issueHighlights: IssueHighlight[] = [
  {
    line: 9,
    startColumn: 18,
    endColumn: 37,
    code: 'error, setErrors',
    message: 'Variable name mismatch'
  },
  {
    line: 17,
    code: 'setError(null);',
    message: 'Should be setErrors(null)'
  },
  {
    line: 19,
    code: 'console.log(err);',
    message: 'Should use proper error handling'
  }
];

export default function Home() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedFile, setSelectedFile] = useState<SidebarItem | null>(null);
  const [fileContent, setFileContent] = useState<string>(mockFileContent);
  const [fileIssues, setFileIssues] = useState<FileIssue[]>(mockIssues);
  const [highlights, setHighlights] = useState<IssueHighlight[]>(issueHighlights);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with first file
  useEffect(() => {
    const firstFile = mockFileStructure[0].children?.[0] || null;
    if (firstFile) {
      setSelectedFile(firstFile);
    }
  }, []);

  // Toggle sidebar visibility
  const handleMenuToggle = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Select a file from the sidebar
  const handleSelectFile = (file: SidebarItem) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      
      // In a real implementation, we would fetch the file content and issues here
      // For now, just use the mock data
      setFileContent(mockFileContent);
      setFileIssues(mockIssues);
      setHighlights(issueHighlights);
      
      // Update sidebar items to mark the selected file as active
      markFileAsActive(file.id);
    }
  };
  
  // Mark the selected file as active in the sidebar
  const markFileAsActive = (fileId: string) => {
    const updateItemActiveStatus = (items: SidebarItem[]): SidebarItem[] => {
      return items.map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            children: updateItemActiveStatus(item.children)
          };
        }
        
        return {
          ...item,
          isActive: item.id === fileId
        };
      });
    };
    
    // In a real implementation, we would update the state of the sidebar items
    // For now, just leave it as is since we're using mock data
  };

  // Apply a fix to the code
  const handleApplyFix = (issue: FileIssue) => {
    // In a real implementation, we would send the fix to the server
    // For now, just update the local state
    
    // Create a new content with the fix applied
    const lines = fileContent.split('\n');
    
    if (issue.line && issue.line > 0 && issue.line <= lines.length && issue.suggestion) {
      lines[issue.line - 1] = issue.suggestion;
      const newContent = lines.join('\n');
      setFileContent(newContent);
      
      // Remove the applied issue
      setFileIssues(fileIssues.filter(i => i.id !== issue.id));
      setHighlights(highlights.filter(h => h.line !== issue.line));
    }
  };

  // Ignore an issue
  const handleIgnoreIssue = (issue: FileIssue) => {
    // In a real implementation, we would send this to the server
    // For now, just update the local state
    setFileIssues(fileIssues.filter(i => i.id !== issue.id));
    setHighlights(highlights.filter(h => h.line !== issue.line));
  };

  // Format the code
  const handleFormatCode = () => {
    // In a real implementation, we would send the code to the server for formatting
    // For now, just show a toast
    toast({
      title: "Code formatted",
      description: "The code has been formatted."
    });
  };

  // Auto fix all issues
  const handleAutoFix = () => {
    // In a real implementation, we would send the code to the server for auto fixing
    // For now, just apply all fixes
    fileIssues.forEach(issue => handleApplyFix(issue));
  };

  // Save fixes
  const handleSaveFixes = () => {
    // In a real implementation, we would send the updated code to the server
    toast({
      title: "Changes saved",
      description: "Your fixes have been saved successfully."
    });
  };

  // Discard changes
  const handleDiscardChanges = () => {
    // In a real implementation, we would reset to the original code
    setFileContent(mockFileContent);
    setFileIssues(mockIssues);
    setHighlights(issueHighlights);
    
    toast({
      title: "Changes discarded",
      description: "All changes have been discarded."
    });
  };

  if (!selectedFile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="GitHub Project Debugger" onMenuToggle={handleMenuToggle} />
        <div className="flex flex-1 justify-center items-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <h1 className="text-2xl font-bold text-gray-900">No File Selected</h1>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                Please select a file from the sidebar to start debugging.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="GitHub Project Debugger" onMenuToggle={handleMenuToggle} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          items={mockFileStructure} 
          onSelectFile={handleSelectFile}
          isVisible={sidebarVisible}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white p-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="font-semibold text-lg text-neutral-700">{selectedFile.name}</h2>
                {fileIssues.length > 0 && (
                  <span className="ml-3 px-2 py-0.5 bg-red-100 text-error rounded-md text-xs font-medium">
                    {fileIssues.length} Issues
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline"
                  className="flex items-center text-sm" 
                  onClick={handleDiscardChanges}
                >
                  <Undo className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button 
                  className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveFixes}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Fixes
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex h-full">
              <div className="w-7/12 border-r border-neutral-200 overflow-y-auto">
                <div className="p-4">
                  <CodeEditor 
                    code={fileContent}
                    filename={selectedFile.name}
                    highlights={highlights}
                    onFormat={handleFormatCode}
                    onAutoFix={handleAutoFix}
                  />
                </div>
              </div>
              
              <div className="w-5/12 overflow-y-auto">
                <div className="p-4">
                  <IssuesPanel 
                    issues={fileIssues}
                    onApplyFix={handleApplyFix}
                    onIgnore={handleIgnoreIssue}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
