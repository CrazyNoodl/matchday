import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoBack } from '@/utils/useGoBack';
import { NavHeader } from '@/components/NavHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { StatsRow } from '@/components/StatsRow';
import { GlowBackground } from '@/components/GlowBackground';
import { useColors, AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { extractStatsFromPhoto, type ExtractedStat } from '@/utils/extractStats';

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

  const getStripeColor = (c: ExtractedStat['confidence']): string | null => {
    if (c === 'low') return '#ffa032';
    if (c === 'medium') return colors.accent.yellow;
    return null;
  };
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string | null>(null);
  const [stats, setStats] = useState<ExtractedStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = async () => {
    if (photos.length >= 4) {
      Alert.alert('Max 4 photos', 'Remove one first.');
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
      const newItems: PhotoItem[] = result.assets
        .filter((a) => a.base64)
        .map((a) => ({
          uri: a.uri,
          base64: a.base64!,
          mimeType: a.mimeType ?? 'image/jpeg',
        }));
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
      setError(e.message ?? 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const lowCount = stats?.filter((s) => s.confidence === 'low').length ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground variant="blue" />
      <NavHeader title="OCR Lab" onBack={() => goBack()} />

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
                {photos.length === 0 ? 'Add photos' : 'Add more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {photos.length > 0 && (
          <Text style={styles.photoCount}>
            {photos.length} photo{photos.length > 1 ? 's' : ''} selected · tap × to remove
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
              <Text style={styles.scanBtnText}>{scanProgress ?? 'Scanning...'}</Text>
            </View>
          ) : (
            <Text style={styles.scanBtnText}>
              {photos.length > 1 ? `Scan ${photos.length} photos with AI` : 'Scan with AI'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Scan failed</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {stats && stats.length > 0 && (
          <>
            <View style={styles.resultHeader}>
              <SectionLabel label="EXTRACTED STATS" />
              <View style={styles.resultMeta}>
                <Text style={styles.resultMetaText}>{stats.length} found</Text>
                {lowCount > 0 && (
                  <View style={styles.metaBadgeLow}>
                    <Text style={styles.metaBadgeLowText}>{lowCount} uncertain</Text>
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
                  <Text style={styles.legendText}>Orange — uncertain, verify manually</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendStripe, { backgroundColor: colors.accent.yellow }]} />
                  <Text style={styles.legendText}>Yellow — slightly unclear in image</Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const THUMB_SIZE = 88;

const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  proxyHint: {
    backgroundColor: 'rgba(106,166,255,0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  proxyHintText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.accent.blue,
    lineHeight: 18,
  },
  proxyHintCode: {
    fontFamily: FontFamily.bodyBold,
  },

  // Thumbnails row
  thumbsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
    color: '#fff',
    lineHeight: 17,
  },
  thumbAdd: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  thumbAddIcon: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: colors.text.muted,
    lineHeight: 28,
  },
  thumbAddLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: colors.text.placeholder,
  },
  photoCount: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    marginBottom: Spacing.lg,
  },

  // Scan button
  scanBtn: {
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  scanBtnDisabled: {
    opacity: 0.35,
  },
  scanBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scanBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.bg.base,
  },

  // Error
  errorCard: {
    backgroundColor: colors.accent.redSubtle,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.22)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: 4,
  },
  errorTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.red,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },

  // Results
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resultMetaText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  metaBadgeLow: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,160,50,0.12)',
    borderColor: 'rgba(255,160,50,0.3)',
  },
  metaBadgeLowText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: '#ffa032',
  },

  statsCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  confStripe: {
    width: 3,
  },
  statContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  legend: {
    gap: 6,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendStripe: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
});
