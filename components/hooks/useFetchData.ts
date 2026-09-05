import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.href = '/sign-in';
    return;
  }
  return res.json();
};

const useFetchData = <T>(route: string) => {
    const { data, error, isLoading, mutate } = useSWR<T[]>(route, fetcher);
    return { data, error, isLoading, mutate };
};

export default useFetchData;