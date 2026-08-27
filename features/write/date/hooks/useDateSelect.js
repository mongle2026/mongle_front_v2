import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  createDateSelectCopy,
  createPresetDates,
  isSameDate,
  startOfDay,
} from '../utils/dateSelect';

const useDateSelect = ({
  initialDate = null,
} = {}) => {
  const today = useMemo(
    () => startOfDay(new Date()),
    [],
  );

  const presetDates = useMemo(
    () => createPresetDates(today),
    [today],
  );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(() => {
    if (!initialDate) {
      return null;
    }

    const date =
      new Date(initialDate);

    date.setHours(
      0,
      0,
      0,
      0,
    );

    return date;
  });

  /**
   * Calendar 날짜 선택
   */
  const handleSelectDate =
    useCallback(
      date => {
        const nextDate =
          startOfDay(date);

        /**
         * 현재 선택된 날짜를
         * 다시 누르면 선택 취소
         */
        setSelectedDate(
          previousDate => {
            if (
              previousDate &&
              isSameDate(
                previousDate,
                nextDate,
              )
            ) {
              return null;
            }

            return nextDate;
          },
        );
      },
      [],
    );

  /**
   * 프리셋 버튼
   */
  const handlePressPreset =
    useCallback(
      preset => {
        const nextDate =
          presetDates[preset];

        if (!nextDate) {
          return;
        }

        setSelectedDate(
          previousDate => {
            /**
             * 같은 프리셋 날짜를
             * 다시 누르면 선택 취소
             */
            if (
              previousDate &&
              isSameDate(
                previousDate,
                nextDate,
              )
            ) {
              return null;
            }

            return new Date(nextDate);
          },
        );
      },
      [presetDates],
    );

  /**
   * Calendar에서 직접 선택했더라도
   * 프리셋 날짜와 동일하면 true
   */
  const isPresetSelected =
    useCallback(
      preset =>
        isSameDate(
          selectedDate,
          presetDates[preset],
        ),
      [
        selectedDate,
        presetDates,
      ],
    );

  const copy = useMemo(
    () =>
      createDateSelectCopy({
        today,
        selectedDate,
        presetDates,
      }),
    [
      today,
      selectedDate,
      presetDates,
    ],
  );

  const resetDate =
    useCallback(() => {
      setSelectedDate(null);
    }, []);

  return {
    selectedDate,
    presetDates,

    copy,

    handleSelectDate,
    handlePressPreset,
    isPresetSelected,

    resetDate,
  };
};

export default useDateSelect;