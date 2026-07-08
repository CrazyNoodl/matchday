import React, { useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet, SheetHeader, SheetFooter, MediaSlider, ConfirmDialog, DropdownMenu } from '@/components';
import { makeStyles } from '@/screens/match/match.styles';
import type { MatchDetailHook } from './useMatchDetail';

interface MatchModalsProps {
  d: MatchDetailHook;
}

export function MatchModals({ d }: MatchModalsProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { match, playerA, playerB, modal, mergedStats } = d;
  const rescanAfterClose = useRef(false);

  return (
    <>
      {/* ── EDIT SCORE MODAL ── */}
      <Sheet visible={modal === 'editScore'} onClose={() => d.store.setModal(null)}>
        <View style={styles.sheet}>
          <SheetHeader
            title={t('matchDetail.editScore.title').toUpperCase()}
            subtitle={t('matchDetail.editScore.subtitle')}
          />

          <View style={styles.scoreEditRow}>
            <View style={styles.scoreEditSide}>
              <Text style={styles.scoreEditName} numberOfLines={1}>
                {playerA?.nick ?? playerA?.name ?? t('matchday.home')}
              </Text>
              <View style={styles.scoreEditControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => d.setEditAScore((v) => Math.max(0, v - 1))}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.scoreEditVal}>{d.editAScore}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => d.setEditAScore((v) => v + 1)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.scoreEditColon}>:</Text>

            <View style={styles.scoreEditSide}>
              <Text style={styles.scoreEditName} numberOfLines={1}>
                {playerB?.nick ?? playerB?.name ?? t('matchday.away')}
              </Text>
              <View style={styles.scoreEditControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => d.setEditBScore((v) => Math.max(0, v - 1))}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.scoreEditVal}>{d.editBScore}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => d.setEditBScore((v) => v + 1)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <SheetFooter
            cancelLabel={t('matchday.dialogs.cancel')}
            onCancel={() => d.store.setModal(null)}
            confirmLabel={t('common.save')}
            onConfirm={d.handleSaveScore}
          />
        </View>
      </Sheet>

      {/* ── MEDIA VIEWER ── */}
      <Modal
        visible={d.viewingMediaIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => d.setViewingMediaIndex(null)}
        statusBarTranslucent
      >
        {d.viewingMediaIndex !== null && match?.media && match.media.length > 0 && (
          <MediaSlider
            items={match.media}
            initialIndex={d.viewingMediaIndex}
            onClose={() => d.setViewingMediaIndex(null)}
          />
        )}
      </Modal>

      {/* ── EDIT STATS MODAL ── */}
      <Sheet visible={modal === 'editStats'} onClose={() => d.store.setModal(null)} snapToMax>
        <View style={styles.sheetFlex}>
          <SheetHeader
            title={t('matchDetail.editStats.title').toUpperCase()}
            subtitle={t('matchDetail.editStats.subtitle')}
          />

          <BottomSheetScrollView
            style={styles.sheetScrollFlex}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {mergedStats
              .filter((stat) => d.editValues[stat.key] !== undefined)
              .map((stat) => {
                const current = d.editValues[stat.key] ?? { a: stat.aVal, b: stat.bVal };
                const label = stat.labelKey ? t(stat.labelKey) : stat.label;
                const isDecimal = stat.step < 1;
                const format = (v: number) => (isDecimal ? v.toFixed(1) : String(v));
                // Muted until touched this session — signals "placeholder, not confirmed"
                // for a param the AI never recognized, without a separate N/A state.
                const isPlaceholder = stat.isNA && !d.touchedStats.has(stat.key);
                const lowConfidence = stat.confidence === 'low' || stat.confidence === 'medium';
                return (
                  <View key={stat.key} style={styles.editStatRow}>
                    <View style={styles.editSideControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => d.adjustStat(stat.key, 'a', -stat.step, stat.isPercent)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={[styles.editStatVal, isPlaceholder && styles.editStatValNA]}>
                        {format(current.a)}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => d.adjustStat(stat.key, 'a', stat.step, stat.isPercent)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.editStatLabelRow}>
                      {lowConfidence && <View style={styles.editConfidenceDot} />}
                      <Text style={styles.editStatLabel}>{label}</Text>
                    </View>

                    <View style={styles.editSideControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => d.adjustStat(stat.key, 'b', -stat.step, stat.isPercent)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={[styles.editStatVal, isPlaceholder && styles.editStatValNA]}>
                        {format(current.b)}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => d.adjustStat(stat.key, 'b', stat.step, stat.isPercent)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {!stat.isCanonical && (
                      <TouchableOpacity
                        style={styles.deleteStatBtn}
                        onPress={() => d.deleteStat(stat.key)}
                        activeOpacity={0.75}
                        accessibilityLabel={t('common.delete')}
                      >
                        <Text style={styles.deleteStatIcon}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            <View style={{ height: 16 }} />
          </BottomSheetScrollView>

          <SheetFooter
            cancelLabel={t('matchday.dialogs.cancel')}
            onCancel={() => d.store.setModal(null)}
            confirmLabel={t('common.save')}
            onConfirm={d.handleSaveStats}
          />
        </View>
      </Sheet>

      {/* ── EDIT NOTE MODAL ── */}
      <Sheet visible={d.editingNote} onClose={() => d.setEditingNote(false)} avoidKeyboard>
        <View style={styles.sheet}>
          <SheetHeader
            title={t('matchDetail.commentary').toUpperCase()}
            subtitle={t('matchDetail.editNote.subtitle')}
          />
          <View style={styles.noteEditBody}>
            <BottomSheetTextInput
              style={styles.noteInput}
              value={d.editNoteValue}
              onChangeText={d.setEditNoteValue}
              placeholder={t('matchDetail.editNote.placeholder')}
              placeholderTextColor={colors.text.placeholder}
              multiline
              autoFocus
              maxLength={500}
            />
            <Text style={styles.noteCharCount}>{d.editNoteValue.length}/500</Text>
          </View>
          <SheetFooter
            cancelLabel={t('matchday.dialogs.cancel')}
            onCancel={() => d.setEditingNote(false)}
            confirmLabel={t('common.save')}
            onConfirm={d.handleSaveNote}
          />
        </View>
      </Sheet>

      {/* ── STATS CONTEXT MENU ── */}
      <DropdownMenu
        visible={d.statsMenu.visible}
        onClose={d.statsMenu.close}
        position={d.statsMenu.position}
        onDismiss={() => {
          if (rescanAfterClose.current) {
            rescanAfterClose.current = false;
            d.handleImportStats();
          }
        }}
        items={[
          {
            key: 'rescan',
            label: t('matchDetail.statsMenu.rescan'),
            loading: d.importingStats,
            disabled: d.importingStats,
            onPress: () => { rescanAfterClose.current = true; d.statsMenu.close(); },
          },
          {
            key: 'edit',
            label: t('common.edit'),
            onPress: () => { d.statsMenu.close(); d.openEditStats(); },
          },
          {
            key: 'clear',
            label: t('matchDetail.statsMenu.clear'),
            destructive: true,
            onPress: () => { d.statsMenu.close(); d.handleClearStats(); },
          },
        ]}
      />

      {/* ── CLEAR STATS DIALOG ── */}
      <ConfirmDialog
        visible={d.showClearStats}
        onRequestClose={() => d.setShowClearStats(false)}
        variant="destructive"
        title={t('matchDetail.clearStats.title').toUpperCase()}
        description={t('matchDetail.clearStats.desc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: () => d.setShowClearStats(false) }}
        confirm={{
          label: t('matchDetail.clearStats.confirm'),
          onPress: () => {
            if (match) d.store.updateMatchStats(match.id, undefined);
            d.setShowClearStats(false);
          },
        }}
      />

      {/* ── SWAP SIDES DIALOG ── */}
      <ConfirmDialog
        visible={d.showSwapSides}
        onRequestClose={() => d.setShowSwapSides(false)}
        variant="destructive"
        title={t('matchDetail.swapSidesDialog.title').toUpperCase()}
        description={t('matchDetail.swapSidesDialog.desc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: () => d.setShowSwapSides(false) }}
        confirm={{
          label: t('matchDetail.swapSidesDialog.confirm'),
          onPress: () => {
            if (match) d.store.swapMatchSides(match.id);
            d.setShowSwapSides(false);
          },
        }}
      />

      {/* ── OCR FAILED ── */}
      <ConfirmDialog
        visible={d.showOcrFailed}
        onRequestClose={() => d.setShowOcrFailed(false)}
        variant="neutral"
        title={t('matchDetail.ocr.failed')}
        description={t('matchDetail.ocr.failedDesc')}
        confirm={{ label: t('common.ok'), onPress: () => d.setShowOcrFailed(false) }}
      />

      {/* ── OCR INVALID PHOTO (recognized too few params to be a real stats screen) ── */}
      <ConfirmDialog
        visible={d.showInvalidStatsPhoto}
        onRequestClose={() => d.setShowInvalidStatsPhoto(false)}
        variant="neutral"
        title={t('matchDetail.ocr.invalidPhoto')}
        description={t('matchDetail.ocr.invalidPhotoDesc')}
        confirm={{ label: t('common.ok'), onPress: () => d.setShowInvalidStatsPhoto(false) }}
      />

      {/* ── DELETE MATCH MODAL ── */}
      <ConfirmDialog
        visible={modal === 'delMatch'}
        onRequestClose={() => d.store.setModal(null)}
        icon="🗑"
        iconColor={colors.accent.red}
        variant="destructive"
        title={t('matchday.dialogs.deleteTitle').toUpperCase()}
        description={t('matchday.dialogs.deleteDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: () => d.store.setModal(null) }}
        confirm={{ label: t('matchday.dialogs.delete'), onPress: d.handleDeleteMatch }}
      />
    </>
  );
}
