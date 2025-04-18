export interface Project {
  id: number;
  name: string;
  description?: string;
  userId?: number;
}

export interface ProjectFile {
  id: number;
  name: string;
  path: string;
  content?: string;
  projectId: number;
  hasErrors: boolean;
  type?: 'file' | 'folder';
}

export interface FileIssue {
  id: number;
  fileId: number;
  line?: number;
  column?: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
  code: string;
  suggestion?: string;
}

export interface CodeSnippet {
  code: string;
  line: number;
  column?: number;
  highlighted?: boolean;
}

export interface IssueHighlight {
  line: number;
  startColumn?: number;
  endColumn?: number;
  code: string;
  replacementCode?: string;
  message: string;
}

export interface User {
  id: number;
  username: string;
}

export interface SidebarItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  hasErrors?: boolean;
  isActive?: boolean;
  children?: SidebarItem[];
}
