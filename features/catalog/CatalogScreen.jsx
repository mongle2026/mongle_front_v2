import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../shared/styles/color';
import TopIconNavigation from '../../shared/components/navigation/topnavigation/TopIconNavigation';
import TabBar from '../../shared/components/navigation/tabbar/TabBar';
import Tabs from '../../shared/components/navigation/tabs/Tabs';
import { FOUNDATION_SECTIONS } from './sections/FoundationSections';
import { COMPONENT_SECTIONS } from './sections/ComponentSections';

const GROUPS = [
  { label: 'Foundation', sections: FOUNDATION_SECTIONS },
  { label: 'Components', sections: COMPONENT_SECTIONS },
];

// 개발 빌드(__DEV__)에서만 열리는 디자인 시스템 카탈로그.
// 한 번에 한 섹션만 그려서 Skia 등 무거운 컴포넌트가 한꺼번에 뜨지 않게 한다
const CatalogScreen = ({ navigation }) => {
  const [groupIndex, setGroupIndex] = useState(0);
  const [sectionIndex, setSectionIndex] = useState(0);
  const scrollRef = useRef(null);

  const { sections } = GROUPS[groupIndex];
  const { Component } = sections[sectionIndex] ?? sections[0];

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  const handleChangeGroup = index => {
    setGroupIndex(index);
    setSectionIndex(0);
    scrollToTop();
  };

  const handleChangeSection = index => {
    setSectionIndex(index);
    scrollToTop();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <TopIconNavigation
        type="text"
        headerText="컴포넌트 카탈로그"
        showNext={false}
        onPressClose={() => navigation.goBack()}
      />

      <View style={styles.header}>
        <TabBar
          tabs={GROUPS.map(group => group.label)}
          activeIndex={groupIndex}
          onChange={handleChangeGroup}
        />
        <Tabs
          key={groupIndex}
          tabs={sections.map(section => section.label)}
          activeIndex={sectionIndex}
          onChange={handleChangeSection}
        />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <Component />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLayerBase,
  },

  header: {
    backgroundColor: colors.bgSurface,
  },

  content: {
    paddingBottom: 80,
  },
});

export default CatalogScreen;
