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
import { NavHeader, Avatar, SectionLabel, StatsRow, GlowBackground } from '@/components';
import { makeStyles } from '@/screens/match/match.styles';
import { useMatchDetail } from '@/screens/match/useMatchDetail';
import { MatchModals } from '@/screens/match/MatchModals';

export default function MatchDetailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const d = useMatchDetail();

  const {
    match,
    playerA,
    playerB,
    aWins,
    bWins,
    isDraw,
    winnerName,
    hasMediaFiles,
    hasStatsOverride,
    mergedStats,
    isCurrentRoundMatch,
    isEditableMatch,
    syncStatus,
    remoteLoading,
    importingStats,
    uploadingMedia,
    statsMenuBtnRef,
  } = d;

  if (!match) {
    const isLoading = syncStatus === 'syncing' || remoteLoading;
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title={t('matchDetail.title')} onBack={() => d.goBack()} />
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
        <Text style={styles.editBtnText}>Edit</Text>
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
        title={t('matchDetail.title')}
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
              {playerA?.nick ?? playerA?.name ?? 'Unknown'}
            </Text>
          </View>

          <View style={styles.heroCenter}>
            <View style={styles.heroScoreRow}>
              <Text
                style={[
                  styles.heroScoreNum,
                  aWins && { color: colors.accent.green },
                  !aWins && !isDraw && { color: '#7c8388' },
                ]}
              >
                {match.aScore}
              </Text>
              <Text style={styles.heroColon}>:</Text>
              <Text
                style={[
                  styles.heroScoreNum,
                  bWins && { color: colors.accent.green },
                  !bWins && !isDraw && { color: '#7c8388' },
                ]}
              >
                {match.bScore}
              </Text>
            </View>
            <Text style={styles.heroResult}>
              {isDraw ? t('matchday.draw') : `${winnerName} won`}
            </Text>
            {isEditableMatch && (
              <TouchableOpacity
                onPress={d.handleSwapSides}
                hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
              >
                <Text style={styles.swapBtnText}>⇄ swap sides</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroSide}>
            <Avatar playerId={match.bId} size="xl" />
            <Text
              style={[styles.heroName, !bWins && !isDraw && styles.heroNameLoser]}
              numberOfLines={1}
            >
              {playerB?.nick ?? playerB?.name ?? 'Unknown'}
            </Text>
          </View>
        </View>

        {/* ── MATCH STATS ── */}
        {hasStatsOverride && (
          <>
            <View style={styles.sectionHeader}>
              <SectionLabel label="MATCH STATS" />
              <View style={styles.sectionHeaderRight}>
                <View style={styles.sourceBadgeBlue}>
                  <Text style={styles.sourceBadgeBlueText}>AI-read</Text>
                </View>
                {isEditableMatch && (
                  <TouchableOpacity
                    ref={statsMenuBtnRef}
                    onPress={d.openStatsMenu}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.statsMenuDots}>···</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.statsCard}>
              {mergedStats.map((stat) => {
                const aLeads = stat.aVal >= stat.bVal;
                const label = stat.labelKey ? t(stat.labelKey) : stat.label;
                return (
                  <StatsRow
                    key={stat.key}
                    label={stat.isPercent ? `${label} %` : label}
                    aValue={stat.aVal}
                    bValue={stat.bVal}
                    aWins={aLeads}
                  />
                );
              })}
            </View>
          </>
        )}

        {/* ── MEDIA ── */}
        <View style={styles.sectionHeader}>
          <SectionLabel label="MEDIA" />
          {isEditableMatch && (
            <View style={styles.mediaActions}>
              {!hasStatsOverride && (
                <TouchableOpacity
                  style={[styles.importStatsBtn, uploadingMedia && styles.btnCrossBlocked]}
                  onPress={d.handleImportStats}
                  activeOpacity={0.75}
                  disabled={importingStats || uploadingMedia}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {importingStats ? (
                    <ActivityIndicator size="small" color={colors.accent.blue} />
                  ) : (
                    <Text style={styles.importStatsBtnText}>📊 Import stats</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.addMediaBtn, importingStats && styles.btnCrossBlocked]}
                onPress={d.handleAddMedia}
                activeOpacity={0.75}
                disabled={uploadingMedia || importingStats}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {uploadingMedia ? (
                  <ActivityIndicator size="small" color={colors.accent.green} />
                ) : (
                  <Text style={styles.addMediaBtnText}>+ Add</Text>
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
            {match.media!.map((item, idx) => (
              <View key={idx} style={styles.mediaThumbnail}>
                <TouchableOpacity
                  onPress={() => d.setViewingMediaIndex(idx)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: item.uri }} style={styles.mediaImage} resizeMode="cover" />
                  {item.type === 'video' && (
                    <View style={styles.videoOverlay}>
                      <Text style={styles.videoPlayIcon}>▶</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {isEditableMatch && (
                  <TouchableOpacity
                    style={styles.mediaDeleteBtn}
                    onPress={() => d.handleDeleteMedia(idx)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.mediaDeleteBtnText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={styles.mediaEmpty}
            onPress={isEditableMatch ? d.handleAddMedia : undefined}
            activeOpacity={isEditableMatch ? 0.7 : 1}
          >
            <Text style={styles.mediaEmptyText}>
              {isEditableMatch ? 'Tap to add media' : 'No media attached'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── COMMENTARY ── */}
        <View style={styles.sectionHeader}>
          <SectionLabel label={t('matchDetail.commentary')} />
          {isEditableMatch && (
            <TouchableOpacity
              onPress={d.openEditNote}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.editLink}>Edit</Text>
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
              {isEditableMatch ? 'Add commentary...' : 'No commentary'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <MatchModals d={d} />
    </SafeAreaView>
  );
}
