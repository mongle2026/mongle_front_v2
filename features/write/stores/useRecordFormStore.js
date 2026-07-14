// 피드와 편지 공통으로 쓰는 작성값

import { create } from 'zustand';

const initialState = {
  recordType: null, // 'FEED' | 'LETTER'
  music: null,
  text: '',
  files: [],
  visibility: 'PUBLIC',
};

export const useRecordFormStore = create((set) => ({
  ...initialState,

  setRecordType: (recordType) =>
    set({
      recordType,
    }),

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

  setVisibility: (visibility) =>
    set({
      visibility,
    }),

  resetRecordForm: () =>
    set({
      ...initialState,
    }),
}));