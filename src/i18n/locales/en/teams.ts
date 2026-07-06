const teams = {
  title: 'Teams',
  noResults: 'No teams yet. Create a team to assign players.',
  noResultsAction: 'Add Team',
  editTitle: 'Edit team',
  newTitle: 'New team',
  addBtn: 'Add team',
  uploading: 'Uploading...',
  deleteConfirm: 'Delete team?',
  deleteDesc: 'This team will be removed.',
  cannotDelete: 'Cannot delete — team is in use.',
  form: {
    name: 'Team name',
    namePlaceholder: 'e.g. Manchester City',
    shortCode: 'Short code (3 letters)',
    shortCodePlaceholder: 'e.g. MCI',
    logo: 'Logo (optional)',
  },
} as const;

export default teams;
