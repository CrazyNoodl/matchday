import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadTeamLogo } from '@/supabase/storage';
import { resizeImage, TEAM_LOGO_MAX_DIMENSION } from '@/utils/imageResize';
import { generateTeamCode } from '@/utils/teamCode';
import { Colors } from '@/theme';
import { type Team } from '@/store/types';

const TEAM_COLORS = Colors.team;

interface UseTeamEditFormOptions {
  teams: Team[];
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  demoMode: boolean;
}

// Owns the create/edit form state and save behavior for a team, including
// logo pick/upload/resize, so every screen that opens a `TeamEditSheet`
// (Settings → Teams, Setup) shares identical behavior, not just markup.
export function useTeamEditForm({ teams, addTeam, updateTeam, demoMode }: UseTeamEditFormOptions) {
  const [visible, setVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState('');
  const [formShort, setFormShort] = useState('');
  const [formColor, setFormColor] = useState<string>(TEAM_COLORS[0]);
  const [formLogo, setFormLogo] = useState<string | undefined>(undefined);
  const [logoUploading, setLogoUploading] = useState(false);
  // Bumped every time a different team's edit form is opened, so an
  // in-flight upload from a form the user already left can't write its
  // result into whichever form happens to be open when it resolves.
  const editSessionRef = useRef(0);

  const openCreate = useCallback(() => {
    editSessionRef.current += 1;
    setEditingTeam(null);
    setFormName('');
    setFormShort('');
    setFormColor(TEAM_COLORS[teams.length % TEAM_COLORS.length]);
    setFormLogo(undefined);
    setLogoUploading(false);
    setVisible(true);
  }, [teams.length]);

  const openEdit = useCallback((team: Team) => {
    editSessionRef.current += 1;
    setEditingTeam(team);
    setFormName(team.name);
    setFormShort(team.short);
    setFormColor(team.color);
    setFormLogo(team.logo);
    setLogoUploading(false);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const pickLogo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const session = editSessionRef.current;
    const asset = result.assets[0];
    let localUri = asset.uri;
    setFormLogo(localUri);
    setLogoUploading(true);
    // Downscale before upload — see #62. Logos only ever render as a small badge.
    try {
      localUri = (await resizeImage(asset.uri, asset, TEAM_LOGO_MAX_DIMENSION)).uri;
    } catch {
      /* fall back to the original file if resizing fails */
    }
    // Demo Mode edits are thrown away on exit (realDataBackup restore) and
    // must never reach the user's real cloud storage — keep the picked
    // logo local-only instead of uploading it under their real account.
    const remoteUrl = demoMode ? localUri : await uploadTeamLogo(localUri);
    if (editSessionRef.current !== session) return; // user moved to a different team's form
    setLogoUploading(false);
    // Local file:// URIs aren't visible to other devices and aren't
    // guaranteed to survive app restarts — only keep the remote URL.
    if (remoteUrl) setFormLogo(remoteUrl);
  }, [demoMode]);

  const removeLogo = useCallback(() => setFormLogo(undefined), []);

  const save = useCallback(() => {
    const name = formName.trim();
    const short = formShort.trim().toUpperCase().slice(0, 3);
    if (!name || !short) return;

    if (editingTeam) {
      updateTeam({ ...editingTeam, name, short, color: formColor, logo: formLogo });
    } else {
      const code = generateTeamCode(short);
      addTeam({
        code,
        name,
        short,
        color: formColor,
        custom: true,
        logo: formLogo,
      });
    }
    setVisible(false);
  }, [formName, formShort, formColor, formLogo, editingTeam, addTeam, updateTeam]);

  return {
    visible,
    editingTeam,
    teamColors: TEAM_COLORS,
    formName,
    setFormName,
    formShort,
    setFormShort,
    formColor,
    setFormColor,
    formLogo,
    logoUploading,
    pickLogo,
    removeLogo,
    openCreate,
    openEdit,
    close,
    save,
  };
}
