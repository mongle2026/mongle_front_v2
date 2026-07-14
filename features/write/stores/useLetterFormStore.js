// 편지 전송에만 필요한 값

import { create } from 'zustand';

const initialState = {
  receiver: null,

  patternId: null,
  colorId: null,
  stampId: null,

  deliveryAt: null,

  isCoverInitialized: false,
};

export const useLetterFormStore = create((set) => ({
  ...initialState,

  setReceiver: (receiver) =>
    set({
      receiver,
    }),

  initializeEnvelope: ({
    patternId,
    colorId,
    stampId,
  }) =>
    set((state) => {
      if (state.isCoverInitialized) {
        return state;
      }

      return {
        patternId,
        colorId,
        stampId,
        isCoverInitialized: true,
      };
    }),

  setEnvelope: ({
    patternId,
    colorId,
    stampId,
  }) =>
    set({
      patternId,
      colorId,
      stampId,
      isCoverInitialized: true,
    }),

  setPatternId: (patternId) =>
    set({
      patternId,
      isCoverInitialized: true,
    }),

  setColorId: (colorId) =>
    set({
      colorId,
      isCoverInitialized: true,
    }),

  setStampId: (stampId) =>
    set({
      stampId,
      isCoverInitialized: true,
    }),

  setDeliveryAt: (deliveryAt) =>
    set({
      deliveryAt,
    }),

  resetLetterForm: () =>
    set({
      ...initialState,
    }),
}));