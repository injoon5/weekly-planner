export function normalizeMemberRole(role) {
  return role === 'editor' ? 'editor' : 'viewer';
}

export function isEditorRole(role) {
  return normalizeMemberRole(role) === 'editor';
}
