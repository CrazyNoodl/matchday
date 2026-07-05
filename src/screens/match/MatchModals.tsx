import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet, MediaSlider } from '@/components';
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
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('matchDetail.editScore.title').toUpperCase()}</Text>
            <Text style={styles.sheetSubtitle}>{t('matchDetail.editScore.subtitle')}</Text>
          </View>

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

          <View style={styles.sheetButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => d.store.setModal(null)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>{t('matchday.dialogs.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={d.handleSaveScore}
              activeOpacity={0.75}
            >
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('matchDetail.editStats.title').toUpperCase()}</Text>
            <Text style={styles.sheetSubtitle}>{t('matchDetail.editStats.subtitle')}</Text>
          </View>

          <BottomSheetScrollView
            style={styles.sheetScrollFlex}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {mergedStats.map((stat) => {
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
                </View>
              );
            })}
            <View style={{ height: 16 }} />
          </BottomSheetScrollView>

          <View style={styles.sheetButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => d.store.setModal(null)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>{t('matchday.dialogs.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={d.handleSaveStats}
              activeOpacity={0.75}
            >
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Sheet>

      {/* ── EDIT NOTE MODAL ── */}
      <Sheet visible={d.editingNote} onClose={() => d.setEditingNote(false)} avoidKeyboard>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('matchDetail.commentary').toUpperCase()}</Text>
            <Text style={styles.sheetSubtitle}>{t('matchDetail.editNote.subtitle')}</Text>
          </View>
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
          <View style={styles.sheetButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => d.setEditingNote(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>{t('matchday.dialogs.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={d.handleSaveNote}
              activeOpacity={0.75}
            >
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Sheet>

      {/* ── STATS CONTEXT MENU ── */}
      <Modal
        visible={d.showStatsMenu}
        transparent
        animationType="none"
        onRequestClose={() => d.setShowStatsMenu(false)}
        statusBarTranslucent
        onDismiss={() => {
          if (rescanAfterClose.current) {
            rescanAfterClose.current = false;
            d.handleImportStats();
          }
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => d.setShowStatsMenu(false)} />
        <View
          style={[
            styles.statsMenuDropdown,
            { top: d.statsMenuPos.top, right: d.statsMenuPos.right },
          ]}
        >
          <TouchableOpacity
            style={styles.statsMenuItem}
            disabled={d.importingStats}
            onPress={() => { rescanAfterClose.current = true; d.setShowStatsMenu(false); }}
          >
            {d.importingStats
              ? <ActivityIndicator size="small" color={colors.text.muted} />
              : <Text style={styles.statsMenuItemText}>{t('matchDetail.statsMenu.rescan')}</Text>
            }
          </TouchableOpacity>
          <View style={styles.statsMenuSep} />
          <TouchableOpacity
            style={styles.statsMenuItem}
            onPress={() => { d.setShowStatsMenu(false); d.openEditStats(); }}
          >
            <Text style={styles.statsMenuItemText}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <View style={styles.statsMenuSep} />
          <TouchableOpacity
            style={styles.statsMenuItem}
            onPress={() => { d.setShowStatsMenu(false); d.handleClearStats(); }}
          >
            <Text style={[styles.statsMenuItemText, { color: colors.accent.red }]}>{t('matchDetail.statsMenu.clear')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── CLEAR STATS DIALOG ── */}
      <Modal
        visible={d.showClearStats}
        transparent
        animationType="fade"
        onRequestClose={() => d.setShowClearStats(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('matchDetail.clearStats.title').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('matchDetail.clearStats.desc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancel}
                onPress={() => d.setShowClearStats(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={() => {
                  if (match) d.store.updateMatchStats(match.id, undefined);
                  d.setShowClearStats(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>{t('matchDetail.clearStats.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SWAP SIDES DIALOG ── */}
      <Modal
        visible={d.showSwapSides}
        transparent
        animationType="fade"
        onRequestClose={() => d.setShowSwapSides(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('matchDetail.swapSidesDialog.title').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>
              {t('matchDetail.swapSidesDialog.desc')}
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancel}
                onPress={() => d.setShowSwapSides(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={() => {
                  if (match) d.store.swapMatchSides(match.id);
                  d.setShowSwapSides(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>{t('matchDetail.swapSidesDialog.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* ── OCR FAILED ── */}
      <Modal
        visible={d.showOcrFailed}
        transparent
        animationType="fade"
        onRequestClose={() => d.setShowOcrFailed(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('matchDetail.ocr.failed')}</Text>
            <Text style={styles.dialogDesc}>{t('matchDetail.ocr.failedDesc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancel}
                onPress={() => d.setShowOcrFailed(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogCancelText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── OCR INVALID PHOTO (recognized too few params to be a real stats screen) ── */}
      <Modal
        visible={d.showInvalidStatsPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => d.setShowInvalidStatsPhoto(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('matchDetail.ocr.invalidPhoto')}</Text>
            <Text style={styles.dialogDesc}>{t('matchDetail.ocr.invalidPhotoDesc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancel}
                onPress={() => d.setShowInvalidStatsPhoto(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogCancelText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* ── DELETE MATCH MODAL ── */}
      <Modal
        visible={modal === 'delMatch'}
        transparent
        animationType="fade"
        onRequestClose={() => d.store.setModal(null)}
        statusBarTranslucent
      >
        <View style={styles.delOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => d.store.setModal(null)} />
          <View style={styles.delDialog}>
            <View style={styles.delIconCircle}>
              <Text style={styles.delIconEmoji}>🗑</Text>
            </View>
            <Text style={styles.delTitle}>{t('matchday.dialogs.deleteTitle').toUpperCase()}</Text>
            <Text style={styles.delDesc}>{t('matchday.dialogs.deleteDesc')}</Text>
            <View style={styles.delButtons}>
              <TouchableOpacity
                style={styles.delCancelBtn}
                onPress={() => d.store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={styles.delCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.delConfirmBtn}
                onPress={d.handleDeleteMatch}
                activeOpacity={0.75}
              >
                <Text style={styles.delConfirmText}>{t('matchday.dialogs.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
