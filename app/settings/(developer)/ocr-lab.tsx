import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoBack } from '@/utils/useGoBack';
import { NavHeader, SectionLabel, StatsRow, GlowBackground } from '@/components';
import { useColors } from '@/theme';
import { extractStatsFromPhoto, type ExtractedStat } from '@/utils/extractStats';
import { resizeImage, OCR_PAYLOAD_MAX_DIMENSION } from '@/utils/imageResize';
import { makeStyles } from '@/screens/settings/ocr-lab/ocr-lab.styles';
import { makeDialogStyles } from '@/screens/round/RoundDialogs.styles';

interface PhotoItem {
  uri: string;
  base64: string;
  mimeType: string;
}

function confidenceRank(c: ExtractedStat['confidence']): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1;
}

function mergeStatArrays(all: ExtractedStat[][]): ExtractedStat[] {
  const map = new Map<string, ExtractedStat>();
  for (const stats of all) {
    for (const stat of stats) {
      const existing = map.get(stat.key);
      if (!existing || confidenceRank(stat.confidence) > confidenceRank(existing.confidence)) {
        map.set(stat.key, stat);
      }
    }
  }
  return Array.from(map.values());
}


function getBgColor(c: ExtractedStat['confidence']): string {
  if (c === 'low') return 'rgba(255,160,50,0.14)';
  if (c === 'medium') return 'rgba(246,195,80,0.07)';
  return 'transparent';
}

export default function OcrLabScreen() {
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
  const dialogStyles = makeDialogStyles(colors);
  const { t } = useTranslation();

  const getStripeColor = (c: ExtractedStat['confidence']): string | null => {
    if (c === 'low') return '#ffa032';
    if (c === 'medium') return colors.accent.yellow;
    return null;
  };
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showMaxPhotosDialog, setShowMaxPhotosDialog] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string | null>(null);
  const [stats, setStats] = useState<ExtractedStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = async () => {
    if (photos.length >= 4) {
      setShowMaxPhotosDialog(true);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled) {
      // Mirrors the production OCR payload downscale (see #62) so this lab reflects
      // what the AI provider actually receives at runtime.
      const newItems: PhotoItem[] = await Promise.all(
        result.assets
          .filter((a) => a.base64)
          .map(async (a) => {
            let base64 = a.base64!;
            try {
              const resized = await resizeImage(a.uri, a, OCR_PAYLOAD_MAX_DIMENSION, { base64: true });
              if (resized.base64) base64 = resized.base64;
            } catch { /* keep original base64 */ }
            return { uri: a.uri, base64, mimeType: a.mimeType ?? 'image/jpeg' };
          }),
      );
      setPhotos((prev) => [...prev, ...newItems].slice(0, 4));
      setStats(null);
      setError(null);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setStats(null);
  };

  const scanAll = async () => {
    if (photos.length === 0) return;
    setScanning(true);
    setError(null);
    setStats(null);
    try {
      const allResults: ExtractedStat[][] = [];
      for (let i = 0; i < photos.length; i++) {
        setScanProgress(`Scanning ${i + 1} / ${photos.length}...`);
        const result = await extractStatsFromPhoto(photos[i].base64, photos[i].mimeType);
        allResults.push(result);
      }
      setScanProgress(null);
      setStats(mergeStatArrays(allResults));
    } catch (e: any) {
      setScanProgress(null);
      setError(e.message ?? t('ocrLab.scanFailedFallback'));
    } finally {
      setScanning(false);
    }
  };

  const lowCount = stats?.filter((s) => s.confidence === 'low').length ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground variant="blue" />
      <NavHeader title={t('ocrLab.title')} onBack={() => goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo thumbnails row */}
        <View style={styles.thumbsRow}>
          {photos.map((photo, idx) => (
            <View key={idx} style={styles.thumb}>
              <Image source={{ uri: photo.uri }} style={styles.thumbImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => removePhoto(idx)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.thumbRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < 4 && (
            <TouchableOpacity style={styles.thumbAdd} onPress={addPhotos} activeOpacity={0.8}>
              <Text style={styles.thumbAddIcon}>+</Text>
              <Text style={styles.thumbAddLabel}>
                {photos.length === 0 ? t('ocrLab.addPhotos') : t('ocrLab.addMore')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {photos.length > 0 && (
          <Text style={styles.photoCount}>
            {photos.length === 1
              ? t('ocrLab.photosSelected', { count: photos.length })
              : t('ocrLab.photosSelectedPlural', { count: photos.length })}
          </Text>
        )}

        {/* Scan button */}
        <TouchableOpacity
          style={[styles.scanBtn, (photos.length === 0 || scanning) && styles.scanBtnDisabled]}
          onPress={scanAll}
          activeOpacity={0.8}
          disabled={photos.length === 0 || scanning}
        >
          {scanning ? (
            <View style={styles.scanBtnRow}>
              <ActivityIndicator color={colors.bg.base} size="small" />
              <Text style={styles.scanBtnText}>{scanProgress ?? t('ocrLab.scanning')}</Text>
            </View>
          ) : (
            <Text style={styles.scanBtnText}>
              {photos.length > 1 ? t('ocrLab.scanWithCount', { count: photos.length }) : t('ocrLab.scanGeneric')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{t('ocrLab.scanFailedTitle')}</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {stats && stats.length > 0 && (
          <>
            <View style={styles.resultHeader}>
              <SectionLabel label={t('ocrLab.extractedStats').toUpperCase()} />
              <View style={styles.resultMeta}>
                <Text style={styles.resultMetaText}>{t('ocrLab.found', { count: stats.length })}</Text>
                {lowCount > 0 && (
                  <View style={styles.metaBadgeLow}>
                    <Text style={styles.metaBadgeLowText}>{t('ocrLab.uncertain', { count: lowCount })}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.statsCard}>
              {stats.map((stat, i) => {
                const aLeads = stat.home >= stat.away;
                const isLast = i === stats.length - 1;
                const stripeColor = getStripeColor(stat.confidence);
                return (
                  <View
                    key={`${stat.key}-${i}`}
                    style={[
                      styles.statRow,
                      { backgroundColor: getBgColor(stat.confidence) },
                      !isLast && styles.statRowDivider,
                    ]}
                  >
                    {stripeColor && (
                      <View style={[styles.confStripe, { backgroundColor: stripeColor }]} />
                    )}
                    <View style={styles.statContent}>
                      <StatsRow
                        label={stat.label}
                        aValue={stat.home}
                        bValue={stat.away}
                        aWins={aLeads}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {lowCount > 0 && (
              <View style={styles.legend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendStripe, { backgroundColor: '#ffa032' }]} />
                  <Text style={styles.legendText}>{t('ocrLab.legendOrange')}</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendStripe, { backgroundColor: colors.accent.yellow }]} />
                  <Text style={styles.legendText}>{t('ocrLab.legendYellow')}</Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <Modal visible={showMaxPhotosDialog} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowMaxPhotosDialog(false)}>
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={dialogStyles.dialogTitle}>{t('ocrLab.maxPhotos')}</Text>
            <Text style={dialogStyles.dialogDesc}>{t('ocrLab.removeOneFirst')}</Text>
            <TouchableOpacity
              style={dialogStyles.confirmBtn}
              onPress={() => setShowMaxPhotosDialog(false)}
              activeOpacity={0.85}
            >
              <Text style={dialogStyles.confirmText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


