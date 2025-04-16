import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`[API] ${method} ${url}`, data ? { data } : '');
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`[API] Response status: ${res.status}`);
    
    if (!res.ok) {
      // Clone response to not consume it
      const clonedRes = res.clone();
      try {
        const errorText = await clonedRes.text();
        console.error(`[API] Error ${res.status} from ${url}: ${errorText}`);
      } catch (err) {
        console.error(`[API] Error ${res.status} from ${url}, couldn't read error`);
      }
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`[API] Exception for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`[Query] Fetching ${queryKey[0]}`);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log(`[Query] Response status for ${queryKey[0]}: ${res.status}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`[Query] Received 401 for ${queryKey[0]}, returning null as configured`);
        return null;
      }
      
      if (!res.ok) {
        // Clone response to avoid consuming it
        const clonedRes = res.clone();
        try {
          const errorText = await clonedRes.text();
          console.error(`[Query] Error ${res.status} from ${queryKey[0]}: ${errorText}`);
        } catch (err) {
          console.error(`[Query] Error ${res.status} from ${queryKey[0]}, couldn't read error`);
        }
      }
      
      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`[Query] Success for ${queryKey[0]}, data:`, data);
      return data;
    } catch (error) {
      console.error(`[Query] Exception for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
