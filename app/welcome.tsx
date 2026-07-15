import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Switch, TouchableOpacity, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { Button } from '@/components';
import { makeStyles, SCREEN_WIDTH } from '@/screens/welcome/welcome.styles';

const SLIDES = [
  { image: require('../assets/onboarding-home.png'), key: 'slide1' },
  { image: require('../assets/onboarding-setup.png'), key: 'slide2' },
  { image: require('../assets/onboarding-round.png'), key: 'slide3' },
  { image: require('../assets/onboarding-stats.png'), key: 'slide4' },
  { icon: '🎮', key: 'slide5' },
] as const;

export default function WelcomeScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
  const setHasSeenOnboarding = useStore((s) => s.setHasSeenOnboarding);
  const setDemoMode = useStore((s) => s.setDemoMode);

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const isLast = index === SLIDES.length - 1;

  const finish = useCallback(() => {
    if (demoEnabled) {
      setDemoMode(true);
    }
    setHasSeenOnboarding(true);
    router.replace('/');
  }, [demoEnabled, setDemoMode, setHasSeenOnboarding, router]);

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(next);
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setIndex(next);
  }, [index, isLast, finish]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        {!isLast && (
          <TouchableOpacity onPress={finish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.text.muted }}>{t('welcome.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={styles.slide}>
            {'image' in slide ? (
              <View style={styles.screenshotWrap}>
                <Image source={slide.image} style={styles.screenshotImage} resizeMode="cover" />
              </View>
            ) : (
              <View style={styles.iconWrap}>
                <Text style={styles.iconText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.3}>
                  {slide.icon}
                </Text>
              </View>
            )}
            <Text style={styles.title}>{t(`welcome.${slide.key}.title`)}</Text>
            <Text style={styles.desc}>{t(`welcome.${slide.key}.desc`)}</Text>
            {slide.key === 'slide5' && (
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelBlock}>
                  <Text style={styles.toggleLabel}>{t('demo.label')}</Text>
                  <Text style={styles.toggleHint}>{t('welcome.demoToggleHint')}</Text>
                </View>
                <Switch
                  value={demoEnabled}
                  onValueChange={setDemoEnabled}
                  trackColor={{ false: colors.bg.elevated, true: colors.accent.yellow }}
                  thumbColor={colors.text.primary}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((slide, i) => (
          <View key={slide.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={isLast ? t('welcome.getStarted') : t('welcome.next')}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
