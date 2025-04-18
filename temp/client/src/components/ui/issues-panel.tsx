import React from 'react';
import { FileIssue } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IssuesPanelProps {
  issues: FileIssue[];
  onApplyFix: (issue: FileIssue) => void;
  onIgnore: (issue: FileIssue) => void;
}

export function IssuesPanel({ issues, onApplyFix, onIgnore }: IssuesPanelProps) {
  const { toast } = useToast();
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'medium':
        return <AlertCircle className="text-error h-5 w-5 mr-2 mt-0.5" />;
      case 'low':
        return <AlertTriangle className="text-accent h-5 w-5 mr-2 mt-0.5" />;
      default:
        return <AlertCircle className="text-error h-5 w-5 mr-2 mt-0.5" />;
    }
  };

  const getSeverityBackground = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'medium':
        return 'bg-red-50';
      case 'low':
        return 'bg-amber-50';
      default:
        return 'bg-red-50';
    }
  };

  const handleApplyFix = (issue: FileIssue) => {
    onApplyFix(issue);
    toast({
      title: "Fix applied",
      description: `The suggested fix for "${issue.message}" has been applied.`,
    });
  };

  const handleIgnore = (issue: FileIssue) => {
    onIgnore(issue);
    toast({
      title: "Issue ignored",
      description: `The issue "${issue.message}" has been ignored.`,
    });
  };

  return (
    <div>
      <h3 className="font-semibold text-neutral-700 mb-4">Issues & Fixes</h3>
      
      {issues.length === 0 ? (
        <div className="text-center p-8 text-neutral-500">
          No issues found in this file
        </div>
      ) : (
        issues.map(issue => (
          <Card key={issue.id} className="bg-white rounded-lg border border-neutral-200 mb-4 shadow-sm">
            <div className={`p-3 border-b border-neutral-200 ${getSeverityBackground(issue.severity)}`}>
              <div className="flex items-start">
                {getSeverityIcon(issue.severity)}
                <div>
                  <h4 className="font-medium text-neutral-800">{issue.message}</h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    {issue.line ? `Line ${issue.line}: ` : ''}{issue.code}
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="text-sm font-medium text-neutral-700 mb-2">Recommended Fix:</div>
              <div className="bg-neutral-100 p-2 rounded-md text-sm font-mono">
                <div className="text-red-500">- {issue.code}</div>
                <div className="text-green-500">+ {issue.suggestion || 'No suggestion available'}</div>
              </div>
              <div className="mt-3 flex justify-between">
                <div>
                  <span className="text-xs text-neutral-500">
                    Severity: {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                  </span>
                </div>
                <div>
                  <Button 
                    variant="link" 
                    className="text-xs text-primary hover:text-blue-600 mr-2 font-medium"
                    onClick={() => handleIgnore(issue)}
                  >
                    Ignore
                  </Button>
                  <Button 
                    className="text-xs bg-primary hover:bg-blue-600 text-white px-2 py-1 rounded"
                    onClick={() => handleApplyFix(issue)}
                  >
                    Apply Fix
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {issues.length > 0 && (
        <div className="bg-white border border-neutral-200 p-3 rounded-md mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-accent h-4 w-4 mr-1" />
              <span className="text-sm">
                {issues.length} {issues.length === 1 ? 'issue' : 'issues'} found (
                {issues.filter(i => i.severity === 'high').length} High, 
                {issues.filter(i => i.severity === 'medium').length} Medium, 
                {issues.filter(i => i.severity === 'low').length} Low)
              </span>
            </div>
            <div>
              <Button 
                className="bg-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm mr-2"
                onClick={() => {
                  issues.forEach(issue => handleApplyFix(issue));
                }}
              >
                Fix All Issues
              </Button>
              <Button 
                variant="outline"
                className="border border-neutral-300 hover:bg-neutral-100 px-3 py-1.5 rounded-md text-sm"
              >
                Run Tests
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
