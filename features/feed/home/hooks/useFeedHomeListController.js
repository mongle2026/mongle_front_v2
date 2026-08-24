import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { gap } from '../../../../shared/styles/token';
import { hasImageFiles } from '../../../../shared/utils/media';

const ESTIMATED_HEIGHT_WITH_IMAGES = 537;
const ESTIMATED_HEIGHT_WITHOUT_IMAGES = 532;

const getEstimatedPostHeight = item =>
  hasImageFiles(item?.files) ? ESTIMATED_HEIGHT_WITH_IMAGES : ESTIMATED_HEIGHT_WITHOUT_IMAGES;

const useFeedHomeListController = ({ posts, activeTab, setActiveTab, resetPlayback }) => {
  const listRef = useRef(null);
  const measuredPostHeightsRef = useRef(new Map());
  const measurementFrameRef = useRef(null);
  const tabOffsetsRef = useRef({});
  const currentOffsetRef = useRef(0);
  const pendingRestoreTabRef = useRef(null);

  const [listHeight, setListHeight] = useState(0);
  const [measurementVersion, setMeasurementVersion] = useState(0);

  const postMetrics = useMemo(() => {
    if (posts.length === 0) {
      return { snapOffsets: [], paddingTop: 0, paddingBottom: 0 };
    }

    const heights = posts.map(item => {
      const feedId = String(item.feedId);
      return measuredPostHeightsRef.current.get(feedId) ?? getEstimatedPostHeight(item);
    });

    const firstHeight = heights[0];
    const lastHeight = heights[heights.length - 1];

    const paddingTop = listHeight > 0 ? Math.max((listHeight - firstHeight) / 2, 0) : 0;
    const paddingBottom = listHeight > 0 ? Math.max((listHeight - lastHeight) / 2, 0) : 0;

    let currentTop = paddingTop;

    const snapOffsets = heights.map(height => {
      const offset = listHeight > 0 ? Math.max(currentTop - (listHeight - height) / 2, 0) : currentTop;
      currentTop += height + gap.M;
      return offset;
    });

    return { snapOffsets, paddingTop, paddingBottom };
  }, [listHeight, measurementVersion, posts]);

  const scheduleMetricsUpdate = useCallback(() => {
    if (measurementFrameRef.current !== null) return;

    measurementFrameRef.current = requestAnimationFrame(() => {
      measurementFrameRef.current = null;
      setMeasurementVersion(version => version + 1);
    });
  }, []);

  const handlePostLayout = useCallback(
    (feedId, event) => {
      const nextHeight = Math.round(event.nativeEvent.layout.height);
      if (nextHeight <= 0) return;

      const previousHeight = measuredPostHeightsRef.current.get(feedId);
      if (previousHeight === nextHeight) return;

      measuredPostHeightsRef.current.set(feedId, nextHeight);
      scheduleMetricsUpdate();
    },
    [scheduleMetricsUpdate]
  );

  const handleListLayout = useCallback(event => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setListHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  const handleListScrollEnd = useCallback(
    event => {
      const offset = Math.max(0, event.nativeEvent.contentOffset.y);
      currentOffsetRef.current = offset;
      tabOffsetsRef.current[activeTab] = offset;
    },
    [activeTab]
  );

  const handleChangeTab = useCallback(
    nextTab => {
      if (nextTab === activeTab) return;

      tabOffsetsRef.current[activeTab] = currentOffsetRef.current;
      resetPlayback();
      pendingRestoreTabRef.current = nextTab;
      setActiveTab(nextTab);
    },
    [activeTab, resetPlayback, setActiveTab]
  );

  useEffect(() => {
    if (pendingRestoreTabRef.current !== activeTab) return;
    if (posts.length === 0) return;

    const frame = requestAnimationFrame(() => {
      const targetOffset = Math.max(0, Number(tabOffsetsRef.current[activeTab] ?? 0));
      listRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
      currentOffsetRef.current = targetOffset;
      pendingRestoreTabRef.current = null;
    });

    return () => cancelAnimationFrame(frame);
  }, [activeTab, posts.length]);

  useEffect(() => {
    return () => {
      if (measurementFrameRef.current !== null) {
        cancelAnimationFrame(measurementFrameRef.current);
        measurementFrameRef.current = null;
      }
    };
  }, []);

  return {
    listRef,
    postMetrics,
    handlePostLayout,
    handleListLayout,
    handleListScrollEnd,
    handleChangeTab,
  };
};

export default useFeedHomeListController;