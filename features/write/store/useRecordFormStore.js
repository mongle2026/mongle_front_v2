// 피드와 편지에서 공통으로 사용하는 작성값

import { create } from 'zustand';

const initialState = {
  music: null,
  text: '',
  files: [],
};

export const useRecordFormStore = create((set) => ({
  ...initialState,

  setMusic: (music) =>
    set({
      music,
    }),

  setText: (text) =>
    set({
      text,
    }),

  setFiles: (files) =>
    set({
      files,
    }),

  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
    })),

  removeFile: (uri) =>
    set((state) => ({
      files: state.files.filter(
        (file) => file.uri !== uri,
      ),
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
      };
    }),

  resetRecordForm: () =>
    set({
      ...initialState,
    }),
}));