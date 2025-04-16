import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function TestLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{ success: boolean, message: string, data?: any }>({ 
    success: false, 
    message: "No login attempt yet" 
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult({ success: false, message: "Attempting login..." });
    
    try {
      console.log(`[Test] Login attempt with username: ${username}`);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      console.log(`[Test] Login response status: ${response.status}`);
      
      let responseText;
      try {
        responseText = await response.text();
        console.log(`[Test] Response body: ${responseText}`);
      } catch (textError) {
        console.error("[Test] Error reading response text:", textError);
      }
      
      if (response.ok) {
        let userData;
        try {
          userData = responseText ? JSON.parse(responseText) : null;
          console.log("[Test] Parsed user data:", userData);
          setResult({ 
            success: true, 
            message: `Login successful! User: ${userData?.username}, Role: ${userData?.role}`,
            data: userData
          });
        } catch (parseError) {
          console.error("[Test] Error parsing JSON:", parseError);
          setResult({ 
            success: true, 
            message: `Login successful but couldn't parse response: ${responseText}`
          });
        }
      } else {
        setResult({ 
          success: false, 
          message: `Login failed with status ${response.status}: ${responseText || response.statusText}`
        });
      }
    } catch (error) {
      console.error("[Test] Fetch error:", error);
      setResult({ 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("[Test] Attempting logout");
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      console.log(`[Test] Logout response status: ${response.status}`);
      
      if (response.ok) {
        setResult({ 
          success: true, 
          message: "Logout successful!"
        });
      } else {
        let text = await response.text();
        setResult({ 
          success: false, 
          message: `Logout failed with status ${response.status}: ${text || response.statusText}`
        });
      }
    } catch (error) {
      console.error("[Test] Logout error:", error);
      setResult({ 
        success: false, 
        message: `Error during logout: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  const checkSession = async () => {
    try {
      console.log("[Test] Checking current session");
      const response = await fetch("/api/user", {
        credentials: "include"
      });
      
      console.log(`[Test] Session check response status: ${response.status}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("[Test] Current user data:", userData);
        setResult({ 
          success: true, 
          message: `Current session: User: ${userData?.username}, Role: ${userData?.role}`,
          data: userData
        });
      } else {
        setResult({ 
          success: false, 
          message: response.status === 401 
            ? "Not logged in (401 Unauthorized)" 
            : `Error checking session: ${response.status} ${response.statusText}`
        });
      }
    } catch (error) {
      console.error("[Test] Session check error:", error);
      setResult({ 
        success: false, 
        message: `Error checking session: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Authentication Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 flex space-x-2">
            <Button onClick={handleLogout} variant="outline" className="w-1/2">
              Logout
            </Button>
            <Button onClick={checkSession} variant="outline" className="w-1/2">
              Check Session
            </Button>
          </div>
          
          <div className={`mt-4 p-3 rounded-md ${
            result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            <p className="font-medium">{result.message}</p>
            {result.data && (
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>Test Users:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>Super Admin: username = <strong>admin</strong> / password = <strong>password123!</strong></li>
              <li>Restaurant Admin: username = <strong>manager</strong> / password = <strong>password123!</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}