/**
 * Fetcher function for SWR
 * @param url The URL to fetch data from
 * @returns The JSON response
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  let response: Response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
};
