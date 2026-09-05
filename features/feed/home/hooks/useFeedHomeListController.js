import { useCallback, useEffect, useRef, useState } from 'react';

import { gap } from '../../../../shared/styles/token';

// 현재 게시물 위 게시물이 살짝 보이는 정도 + 게시물 사이 간격
const PEEK_HEIGHT = gap.M;
const POST_GAP = gap.M;

const useFeedHomeListController = ({
  posts,
  activeTab,
  setActiveTab,
  resetPlayback,
  reservedBottomSpace = 0,
}) => {
  const listRef = useRef(null);
  const tabOffsetsRef = useRef({});
  const currentOffsetRef = useRef(0);
  const pendingRestoreTabRef = useRef(null);

  const [listHeight, setListHeight] = useState(0);

  // 남은 공간을 전부 PostCard가 차지하도록 화면 높이에서 고정 간격만큼 뺀 값을 카드 높이로 사용
  const viewportHeight = Math.max(listHeight - reservedBottomSpace, 0);
  const postCardHeight = Math.max(viewportHeight - PEEK_HEIGHT - POST_GAP, 0);

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

  return {
    listRef,
    postCardHeight,
    paddingTop: PEEK_HEIGHT + POST_GAP,
    paddingBottom: reservedBottomSpace,
    snapToInterval: postCardHeight + POST_GAP,
    handleListLayout,
    handleListScrollEnd,
    handleChangeTab,
  };
};

export default useFeedHomeListController;
