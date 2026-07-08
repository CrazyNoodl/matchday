import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { useIsOnline } from '@/hooks/useIsOnline';
import { NavHeader, Avatar, SectionLabel, StatsRow, GlowBackground } from '@/components';
import { makeStyles } from '@/screens/match/match.styles';
import { useMatchDetail } from '@/screens/match/useMatchDetail';
import { MatchModals } from '@/screens/match/MatchModals';

export default function MatchDetailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const d = useMatchDetail();
  const isOffline = !useIsOnline();

  const {
    match,
    playerA,
    playerB,
    aWins,
    bWins,
    isDraw,
    winnerName,
    hasMediaFiles,
    isMediaFull,
    visibleMedia,
    hasStatsOverride,
    mergedStats,
    isCurrentRoundMatch,
    isEditableMatch,
    syncStatus,
    remoteLoading,
    importingStats,
    importStatsStep,
    uploadingMedia,
    retryingMediaUri,
    statsMenu,
  } = d;

  const importStatsLabel =
    importStatsStep === 'preparing' ? t('matchDetail.importStats.preparing')
      : importStatsStep === 'uploading' ? t('matchDetail.importStats.uploading')
      : importStatsStep === 'scanning' ? t('matchDetail.importStats.scanning')
      : null;

  if (!match) {
    const isLoading = syncStatus === 'syncing' || remoteLoading;
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title={t('matchDetail.title').toUpperCase()} onBack={() => d.goBack()} />
        <View style={styles.center}>
          {isLoading ? (
            <ActivityIndicator color={colors.accent.green} size="large" />
          ) : (
            <Text style={styles.emptyText}>{t('matchDetail.noData')}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const headerRight = isEditableMatch ? (
    <View style={styles.headerActions}>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={d.openEditScore}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.editBtnText}>{t('common.edit')}</Text>
      </TouchableOpacity>
      {isCurrentRoundMatch && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => d.store.setModal('delMatch')}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteBtnIcon}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      <NavHeader
        title={t('matchDetail.title').toUpperCase()}
        onBack={() => d.goBack()}
        rightElement={headerRight}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SCORELINE HERO ── */}
        <View style={styles.scoreHero}>
          <View style={styles.heroSide}>
            <Avatar playerId={match.aId} size="xl" />
            <Text
              style={[styles.heroName, !aWins && !isDraw && styles.heroNameLoser]}
              numberOfLines={1}
            >
              {playerA?.nick ?? playerA?.name ?? t('common.unknown')}
            </Text>
          </View>

          <View style={styles.heroCenter}>
            <View style={styles.heroScoreRow}>
              <Text
                style={[
                  styles.heroScoreNum,
                  aWins && { color: colors.accent.green },
                  !aWins && !isDraw && { color: colors.text.ghost },
                ]}
              >
                {match.aScore}
              </Text>
              <Text style={styles.heroColon}>:</Text>
              <Text
                style={[
                  styles.heroScoreNum,
                  bWins && { color: colors.accent.green },
                  !bWins && !isDraw && { color: colors.text.ghost },
                ]}
              >
                {match.bScore}
              </Text>
            </View>
            <Text style={styles.heroResult}>
              {isDraw ? t('matchday.draw') : t('matchDetail.wonBy', { name: winnerName })}
            </Text>
            {isEditableMatch && (
              <TouchableOpacity
                onPress={d.handleSwapSides}
                hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
              >
                <Text style={styles.swapBtnText}>{t('matchDetail.swapSides')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroSide}>
            <Avatar playerId={match.bId} size="xl" />
            <Text
              style={[styles.heroName, !bWins && !isDraw && styles.heroNameLoser]}
              numberOfLines={1}
            >
              {playerB?.nick ?? playerB?.name ?? t('common.unknown')}
            </Text>
          </View>
        </View>

        {/* ── MATCH STATS ── */}
        {hasStatsOverride && (
          <>
            <View style={styles.sectionHeader}>
              <SectionLabel label={t('matchDetail.statsSection').toUpperCase()} />
              <View style={styles.sectionHeaderRight}>
                <View style={styles.sourceBadgeBlue}>
                  <Text style={styles.sourceBadgeBlueText}>{t('matchDetail.aiRead')}</Text>
                </View>
                {isEditableMatch && (
                  importingStats ? (
                    <View style={styles.statsRescanProgress}>
                      <ActivityIndicator size="small" color={colors.accent.blue} />
                      <Text style={styles.statsRescanProgressText}>{importStatsLabel}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      ref={statsMenu.anchorRef}
                      onPress={statsMenu.open}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.statsMenuDots}>···</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.statsCard}>
              {mergedStats.map((stat) => {
                const aLeads = stat.aVal === stat.bVal ? null : stat.aVal > stat.bVal;
                const label = stat.labelKey ? t(stat.labelKey) : stat.label;
                return (
                  <StatsRow
                    key={stat.key}
                    label={stat.isPercent ? `${label} %` : label}
                    aValue={stat.aVal}
                    bValue={stat.bVal}
                    aWins={aLeads}
                    isNA={stat.isNA}
                    lowConfidence={stat.confidence === 'low' || stat.confidence === 'medium'}
                  />
                );
              })}
            </View>
          </>
        )}

        {/* ── MEDIA ── */}
        <View style={styles.sectionHeader}>
          <SectionLabel label={t('matchDetail.media.sectionTitle').toUpperCase()} />
          {isEditableMatch && (
            <View style={styles.mediaActions}>
              {!hasStatsOverride && (
                <TouchableOpacity
                  style={[styles.importStatsBtn, (uploadingMedia || isOffline) && styles.btnCrossBlocked]}
                  onPress={d.handleImportStats}
                  activeOpacity={0.75}
                  disabled={importingStats || uploadingMedia || isOffline}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {importingStats ? (
                    <View style={styles.statsRescanProgress}>
                      <ActivityIndicator size="small" color={colors.accent.blue} />
                      <Text style={styles.importStatsBtnText}>{importStatsLabel}</Text>
                    </View>
                  ) : (
                    <Text style={styles.importStatsBtnText}>{t('matchDetail.importStats.cta')}</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.addMediaBtn, (importingStats || isMediaFull || isOffline) && styles.btnCrossBlocked]}
                onPress={d.handleAddMedia}
                activeOpacity={0.75}
                disabled={uploadingMedia || importingStats || isMediaFull || isOffline}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {uploadingMedia ? (
                  <View style={styles.statsRescanProgress}>
                    <ActivityIndicator size="small" color={colors.accent.green} />
                    <Text style={styles.addMediaBtnText}>{t('matchDetail.importStats.preparing')}</Text>
                  </View>
                ) : (
                  <Text style={styles.addMediaBtnText}>{'+ ' + t('common.add')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hasMediaFiles ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaScroll}
          >
            {visibleMedia.map(({ item, originalIndex }) => {
              const isRetrying = retryingMediaUri === item.uri;
              return (
                <View key={originalIndex} style={styles.mediaThumbnail}>
                  <TouchableOpacity
                    onPress={item.uploading
                      ? undefined
                      : item.pendingUpload
                        ? (isOffline ? undefined : () => d.handleRetryUpload(item.uri))
                        : () => d.setViewingMediaIndex(originalIndex)}
                    activeOpacity={item.uploading ? 1 : 0.85}
                    disabled={isRetrying || !!item.uploading || (item.pendingUpload && isOffline)}
                  >
                    <Image source={{ uri: item.uri }} style={styles.mediaImage} resizeMode="cover" />
                    {item.uploading && (
                      <View style={styles.pendingUploadOverlay}>
                        <ActivityIndicator size="small" color={colors.accent.green} />
                      </View>
                    )}
                    {item.pendingUpload && (
                      <View style={styles.pendingUploadOverlay}>
                        {isRetrying ? (
                          <ActivityIndicator size="small" color={colors.accent.yellow} />
                        ) : (
                          <>
                            <Text style={styles.pendingUploadIcon}>⚠</Text>
                            <Text style={styles.pendingUploadText}>{t('matchDetail.media.retryUpload')}</Text>
                          </>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                  {isEditableMatch && !item.uploading && (
                    <TouchableOpacity
                      style={[styles.mediaDeleteBtn, isOffline && styles.btnCrossBlocked]}
                      onPress={() => d.handleDeleteMedia(originalIndex)}
                      disabled={isOffline}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.mediaDeleteBtnText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={styles.mediaEmpty}
            onPress={isEditableMatch && !isOffline ? d.handleAddMedia : undefined}
            activeOpacity={isEditableMatch && !isOffline ? 0.7 : 1}
          >
            <Text style={styles.mediaEmptyText}>
              {isEditableMatch && !isOffline ? t('matchDetail.media.tapToAdd') : t('matchDetail.media.empty')}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── COMMENTARY ── */}
        <View style={styles.sectionHeader}>
          <SectionLabel label={t('matchDetail.commentary').toUpperCase()} />
          {isEditableMatch && (
            <TouchableOpacity
              onPress={d.openEditNote}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.editLink}>{t('common.edit')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {match.note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{match.note}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noNoteRow}
            onPress={isEditableMatch ? d.openEditNote : undefined}
            activeOpacity={isEditableMatch ? 0.7 : 1}
          >
            <Text style={styles.noNoteText}>
              {isEditableMatch ? t('matchDetail.commentaryPrompt') : t('matchDetail.noCommentary')}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <MatchModals d={d} />
    </SafeAreaView>
  );
}
