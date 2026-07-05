import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoBack } from '@/utils/useGoBack';
import { NavHeader, GlowBackground } from '@/components';
import { useColors } from '@/theme';
import {
  resizeImage,
  MEDIA_MAX_DIMENSION,
  OCR_PAYLOAD_MAX_DIMENSION,
  STAT_PHOTO_STORAGE_MAX_DIMENSION,
  TEAM_LOGO_MAX_DIMENSION,
} from '@/utils/imageResize';
import { makeStyles } from '@/screens/settings/resize-lab/resize-lab.styles';

// base64 has no size metadata of its own — derive the byte count from its
// length (each 4 chars encode 3 bytes, minus padding) so every preset's
// "after" size in this lab is measured the same way, not guessed.
function base64ByteSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

interface Preset {
  labelKey: 'resizeLab.presets.regularMedia' | 'resizeLab.presets.ocrPayload' | 'resizeLab.presets.statPhotoStorage' | 'resizeLab.presets.teamLogo';
  target: string;
  maxDimension: number;
}

const PRESETS: Preset[] = [
  { labelKey: 'resizeLab.presets.regularMedia', target: `${MEDIA_MAX_DIMENSION}px cap`, maxDimension: MEDIA_MAX_DIMENSION },
  { labelKey: 'resizeLab.presets.ocrPayload', target: `${OCR_PAYLOAD_MAX_DIMENSION}px cap`, maxDimension: OCR_PAYLOAD_MAX_DIMENSION },
  { labelKey: 'resizeLab.presets.statPhotoStorage', target: `${STAT_PHOTO_STORAGE_MAX_DIMENSION}px cap`, maxDimension: STAT_PHOTO_STORAGE_MAX_DIMENSION },
  { labelKey: 'resizeLab.presets.teamLogo', target: `${TEAM_LOGO_MAX_DIMENSION}px cap`, maxDimension: TEAM_LOGO_MAX_DIMENSION },
];

interface PresetResult {
  status: 'loading' | 'done' | 'error';
  uri?: string;
  width?: number;
  height?: number;
  size?: number;
  error?: string;
}

interface OriginalPhoto {
  uri: string;
  fileName: string;
  width: number;
  height: number;
  size: number;
}

export default function ResizeLabScreen() {
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { t } = useTranslation();

  const [original, setOriginal] = useState<OriginalPhoto | null>(null);
  const [results, setResults] = useState<PresetResult[]>([]);
  const [picking, setPicking] = useState(false);

  const pickPhoto = async () => {
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as unknown as ImagePicker.MediaTypeOptions,
        quality: 1,
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];

      const originalSize = asset.fileSize ?? (asset.base64 ? base64ByteSize(asset.base64) : 0);
      setOriginal({
        uri: asset.uri,
        fileName: asset.fileName ?? 'photo.jpg',
        width: asset.width,
        height: asset.height,
        size: originalSize,
      });

      // Every preset runs independently and reports its own success/failure —
      // unlike production code, nothing here is silently swallowed, so a resize
      // that throws on this device/photo combo is visible instead of hidden.
      setResults(PRESETS.map(() => ({ status: 'loading' })));
      PRESETS.forEach((preset, idx) => {
        resizeImage(asset.uri, asset, preset.maxDimension, { base64: true })
          .then((r) => {
            const size = r.base64 ? base64ByteSize(r.base64) : originalSize;
            setResults((prev) => prev.map((item, i) => (
              i === idx ? { status: 'done', uri: r.uri, size } : item
            )));
          })
          .catch((e) => {
            setResults((prev) => prev.map((item, i) => (
              i === idx ? { status: 'error', error: e?.message ?? String(e) } : item
            )));
          });
      });
    } finally {
      setPicking(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground variant="blue" />
      <NavHeader title={t('resizeLab.title')} onBack={() => goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.pickBtn} onPress={pickPhoto} activeOpacity={0.8} disabled={picking}>
          {picking ? (
            <ActivityIndicator color={colors.bg.base} size="small" />
          ) : (
            <Text style={styles.pickBtnText}>
              {original ? t('resizeLab.pickAnotherPhoto') : t('resizeLab.pickPhoto')}
            </Text>
          )}
        </TouchableOpacity>

        {!original && (
          <Text style={styles.emptyHint}>
            {t('resizeLab.emptyHint')}
          </Text>
        )}

        {original && (
          <View style={styles.originalCard}>
            <View style={styles.thumb}>
              <Image source={{ uri: original.uri }} style={styles.thumbImage} resizeMode="cover" />
            </View>
            <View style={styles.originalInfo}>
              <Text style={styles.originalLabel}>{t('resizeLab.original')}</Text>
              <Text style={styles.originalName} numberOfLines={1}>{original.fileName}</Text>
              <Text style={styles.originalMeta}>
                {original.width}×{original.height} · {formatBytes(original.size)}
              </Text>
            </View>
          </View>
        )}

        {original && PRESETS.map((preset, idx) => {
          const r = results[idx];
          const reductionPct = r?.status === 'done' && original.size > 0
            ? Math.round((1 - r.size! / original.size) * 100)
            : null;
          return (
            <View key={preset.labelKey} style={styles.presetCard}>
              <View style={styles.thumb}>
                {r?.status === 'done' && r.uri ? (
                  <Image source={{ uri: r.uri }} style={styles.thumbImage} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbImage} />
                )}
              </View>
              <View style={styles.presetInfo}>
                <Text style={styles.presetName}>{t(preset.labelKey)}</Text>
                <Text style={styles.presetTarget}>{preset.target}</Text>
                {r?.status === 'loading' && (
                  <View style={styles.presetMetaRow}>
                    <ActivityIndicator size="small" color={colors.text.muted} />
                    <Text style={styles.presetMeta}>{t('resizeLab.resizing')}</Text>
                  </View>
                )}
                {r?.status === 'error' && (
                  <Text style={styles.errorText} numberOfLines={2}>{t('resizeLab.failed', { error: r.error })}</Text>
                )}
                {r?.status === 'done' && (
                  <View style={styles.presetMetaRow}>
                    <Text style={styles.presetMeta}>{formatBytes(r.size!)}</Text>
                    {reductionPct !== null && (
                      <View style={[
                        styles.reductionBadge,
                        reductionPct > 0 ? styles.reductionBadgeGood : styles.reductionBadgeBad,
                      ]}>
                        <Text style={reductionPct > 0 ? styles.reductionBadgeTextGood : styles.reductionBadgeTextBad}>
                          {reductionPct > 0 ? `-${reductionPct}%` : `+${-reductionPct}%`}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
