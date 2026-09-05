import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.href = '/sign-in';
    return;
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    console.error(`[useFetchData] Invalid JSON from ${url}:`, text.slice(0, 200));
    return null;
  }
};

const useFetchData = <T>(route: string) => {
    const { data, error, isLoading, mutate } = useSWR<T[]>(route, fetcher);
    return { data, error, isLoading, mutate };
};

export default useFetchData;