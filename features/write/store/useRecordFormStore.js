// 피드와 편지에서 공통으로 사용하는 작성값

import { create } from 'zustand';

const initialState = {
  music: null,
  text: '',
  files: [],
  font: 'KYOBO',

  // 수정 화면에서 원본 데이터 대비 변경 여부를 추적하기 위한 값
  isDirty: false,
};

export const useRecordFormStore = create((set) => ({
  ...initialState,

  setMusic: (music) =>
    set({
      music,
      isDirty: true,
    }),

  setText: (text) =>
    set({
      text,
      isDirty: true,
    }),

  setFiles: (files) =>
    set({
      files,
      isDirty: true,
    }),

  setFont: (font) =>
    set({
      font,
      isDirty: true,
    }),

  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
      isDirty: true,
    })),

  removeFile: (uri) =>
    set((state) => ({
      files: state.files.filter(
        (file) => file.uri !== uri,
      ),
      isDirty: true,
    })),

  restoreFile: (file, index) =>
    set((state) => {
      const alreadyExists = state.files.some(
        (item) => item.uri === file.uri,
      );

      if (alreadyExists) {
        return state;
      }

      const nextFiles = [...state.files];

      const safeIndex = Math.min(
        Math.max(index, 0),
        nextFiles.length,
      );

      nextFiles.splice(safeIndex, 0, file);

      return {
        files: nextFiles,
        isDirty: true,
      };
    }),

  resetDirty: () =>
    set({
      isDirty: false,
    }),

  resetRecordForm: () =>
    set({
      ...initialState,
    }),
}));