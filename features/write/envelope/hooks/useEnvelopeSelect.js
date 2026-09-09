import { useEffect, useRef, useState, } from 'react';
import { PATTERNS, } from '../../../../shared/data/envelopeData';
import { TEMPLATES, } from '../data/envelopeTemplateData';
import { resolvePatternColor, } from '../../../../shared/utils/envelopeUtils';
import { useLetterFormStore, } from '../stores/useLetterFormStore';

export const TABS = [
  {
    key: 'template',
    label: '템플릿',
  },
  {
    key: 'pattern',
    label: '패턴',
  },
  {
    key: 'color',
    label: '컬러',
  },
  {
    key: 'stamp',
    label: '우표',
  },
];

function createRandomTemplateSelection() {
  if (TEMPLATES.length === 0) {
    return null;
  }

  const template =
    TEMPLATES[
      Math.floor(
        Math.random() * TEMPLATES.length,
      )
    ];

  const resolved = resolvePatternColor(
    template.patternColorId,
  );

  if (!resolved) {
    return null;
  }

  return {
    templateId: template.id,
    patternId: resolved.pattern.id,
    colorId: resolved.color.id,
    stampId: template.stampId,
  };
}

export default function useEnvelopeSelect() {
  const [activeTab, setActiveTab] =
    useState('template');

  /*
   * templateId는 서버 전송값이 아니라
   * 현재 어떤 템플릿이 선택됐는지 보여주기 위한 UI 상태입니다.
   */
  const [
    selectedTemplateId,
    setSelectedTemplateId,
  ] = useState(null);

  /*
   * 컴포넌트가 다시 렌더링되어도
   * 랜덤값이 계속 바뀌지 않게 합니다.
   */
  const initialSelectionRef = useRef(
    createRandomTemplateSelection(),
  );

  const patternId = useLetterFormStore(
    (state) => state.patternId,
  );

  const colorId = useLetterFormStore(
    (state) => state.colorId,
  );

  const stampId = useLetterFormStore(
    (state) => state.stampId,
  );

  const isCoverInitialized =
    useLetterFormStore(
      (state) => state.isCoverInitialized,
    );

  const initializeEnvelope =
    useLetterFormStore(
      (state) => state.initializeEnvelope,
    );

  const setEnvelope = useLetterFormStore(
    (state) => state.setEnvelope,
  );

  const setPatternId =
    useLetterFormStore(
      (state) => state.setPatternId,
    );

  const setColorId = useLetterFormStore(
    (state) => state.setColorId,
  );

  const setStampId = useLetterFormStore(
    (state) => state.setStampId,
  );

  /*
   * 편지 작성이 처음 시작됐을 때만
   * 랜덤 템플릿을 store에 반영합니다.
   */
  useEffect(() => {
    if (isCoverInitialized) {
      return;
    }

    const initialSelection =
      initialSelectionRef.current;

    if (!initialSelection) {
      return;
    }

    initializeEnvelope({
      patternId:
        initialSelection.patternId,
      colorId:
        initialSelection.colorId,
      stampId:
        initialSelection.stampId,
    });

    setSelectedTemplateId(
      initialSelection.templateId,
    );
  }, [
    initializeEnvelope,
    isCoverInitialized,
  ]);

  const selectedPattern =
    PATTERNS.find(
      (pattern) =>
        pattern.id === patternId,
    ) ?? PATTERNS[0];

  const currentColors =
    selectedPattern?.colors ?? [];

  const handleTabPress = (key) => {
    setActiveTab(key);
  };

  const handleSelectPattern = (
    nextPatternId,
  ) => {
    const pattern = PATTERNS.find(
      (item) =>
        item.id === nextPatternId,
    );

    if (!pattern) {
      return;
    }

    const defaultColor =
      pattern.colors[0];

    if (!defaultColor) {
      return;
    }

    setSelectedTemplateId(null);

    setPatternId(nextPatternId);
    setColorId(defaultColor.id);
  };

  const handleSelectColor = (
    nextColorId,
  ) => {
    const colorExists =
      currentColors.some(
        (item) =>
          item.id === nextColorId,
      );

    if (!colorExists) {
      return;
    }

    setSelectedTemplateId(null);
    setColorId(nextColorId);
  };

  const handleSelectStamp = (
    nextStampId,
  ) => {
    setSelectedTemplateId(null);
    setStampId(nextStampId);
  };

  const handleSelectTemplate = (
    templateId,
  ) => {
    const template = TEMPLATES.find(
      (item) =>
        item.id === templateId,
    );

    if (!template) {
      return;
    }

    const resolved =
      resolvePatternColor(
        template.patternColorId,
      );

    if (!resolved) {
      return;
    }

    setSelectedTemplateId(
      templateId,
    );

    setEnvelope({
      patternId:
        resolved.pattern.id,
      colorId:
        resolved.color.id,
      stampId:
        template.stampId,
    });
  };

  const handleSelectItem = (
    itemId,
  ) => {
    switch (activeTab) {
      case 'template':
        handleSelectTemplate(itemId);
        break;

      case 'pattern':
        handleSelectPattern(itemId);
        break;

      case 'color':
        handleSelectColor(itemId);
        break;

      case 'stamp':
        handleSelectStamp(itemId);
        break;

      default:
        break;
    }
  };

  const selectedItems = {
    template: selectedTemplateId,
    patternId,
    colorId,
    stampId,
  };

  const isNextEnabled = Boolean(
    patternId &&
      colorId &&
      stampId,
  );

  return {
    activeTab,
    selectedItems,
    currentColors,
    isNextEnabled,
    handleTabPress,
    handleSelectItem,
  };
}