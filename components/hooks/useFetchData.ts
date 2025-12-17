import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const useFetchData = <T>(route: string) => {
    const { data, error, isLoading } = useSWR<T[]>(route, fetcher);
    return { data, error, isLoading };
};

export default useFetchData;