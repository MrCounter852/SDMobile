import { useState, useCallback, useRef, useEffect } from 'react';
import { useGlobal } from '../../../core/global';
import { useFocusEffect } from '@react-navigation/native';
import crmService from '../services/crmService';

const useTimelineData = (searchFilters, refreshTrigger) => {
  const { user } = useGlobal();
  
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const lastPageLoaded = useRef(0);
  const lastFetchParams = useRef({ filters: null, refreshTrigger: null });
  
  const ROWS_PER_PAGE = 15;
  const loadTimeline = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!searchFilters.OrigenPreContactoID) {
      setTimelineData([]);
      return;
    }

    if (loadingMore && !isRefresh) return;
    if (pageNum <= lastPageLoaded.current && !isRefresh && pageNum !== 1) return;

    try {
      if (isRefresh || pageNum === 1) {
        setRefreshing(isRefresh);
        if (!isRefresh) setLoading(true);
        lastPageLoaded.current = 0;
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const filters = {
        ...searchFilters,
        EstadoProcesoID: null,
        Page: pageNum,
        Rows: ROWS_PER_PAGE,
        SucursalID: user?.SucursalID,
      };

      console.log(
        `[useTimelineData] Request Filters (Page ${pageNum}):`,
        JSON.stringify(filters, null, 2)
      );

      const response = await crmService.consultarLineasTiempo(filters);

      const newColumns = Array.isArray(response)
        ? response
        : response.data || response.rows || [];

      const totalProcessesReceived = newColumns.reduce(
        (acc, col) => acc + (col.Procesos?.length || 0),
        0
      );

      if (pageNum === 1) {
        setTimelineData(newColumns);
        setPage(1);
        lastPageLoaded.current = 1;

        const anyHasMore = newColumns.some(
          (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
        );
        setHasMore(anyHasMore || totalProcessesReceived === ROWS_PER_PAGE);
      } else {
        setTimelineData((prevData) => {
          const nextData = [...prevData];
          newColumns.forEach((nc) => {
            const existingIndex = nextData.findIndex(
              (oc) => oc.ProcesoLineaTiempoID === nc.ProcesoLineaTiempoID
            );
            if (existingIndex > -1) {
              const existingIds = new Set(
                nextData[existingIndex].Procesos?.map((p) => p.ProcesoID) || []
              );
              const uniqueNewProcesos = (nc.Procesos || []).filter(
                (p) => !existingIds.has(p.ProcesoID)
              );
              nextData[existingIndex] = {
                ...nextData[existingIndex],
                Procesos: [
                  ...(nextData[existingIndex].Procesos || []),
                  ...uniqueNewProcesos,
                ],
                TotalProcesos:
                  nc.TotalProcesos ?? nextData[existingIndex].TotalProcesos,
                TotalValorNegocio:
                  nc.TotalValorNegocio ??
                  nextData[existingIndex].TotalValorNegocio,
              };
            } else {
              nextData.push(nc);
            }
          });

          const anyHasMore = nextData.some(
            (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
          );
          setHasMore(anyHasMore || totalProcessesReceived === ROWS_PER_PAGE);

          return nextData;
        });
        setPage(pageNum);
        lastPageLoaded.current = pageNum;
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      if (pageNum === 1) setTimelineData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [searchFilters, user?.SucursalID, loadingMore]);

  const refresh = useCallback(() => {
    loadTimeline(1, true);
  }, [loadTimeline]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && !refreshing && !loadingMore) {
      loadTimeline(page + 1);
    }
  }, [hasMore, loading, refreshing, loadingMore, page, loadTimeline]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.SucursalID) return;

      const filtersChanged =
        JSON.stringify(lastFetchParams.current.filters) !==
        JSON.stringify(searchFilters);
      const triggerChanged =
        lastFetchParams.current.refreshTrigger !== refreshTrigger;

      if (filtersChanged || triggerChanged) {
        loadTimeline(1, true);
        lastFetchParams.current = {
          filters: JSON.parse(JSON.stringify(searchFilters)),
          refreshTrigger,
        };
      }
    }, [searchFilters, refreshTrigger, user?.SucursalID, loadTimeline])
  );

  return {
    timelineData,
    loading,
    refreshing,
    hasMore,
    loadingMore,
    page,
    refresh,
    loadMore,
    loadTimeline,
  };
};

export default useTimelineData;
