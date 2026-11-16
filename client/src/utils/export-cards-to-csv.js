function escapeField(value) {
  const str = value == null ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

export default function exportCardsToCsv(cards, lists, boardName, t) {
  const listMap = Object.fromEntries(lists.map((l) => [l.id, l.name]));

  const headers = [
    t('action.exportCsvColumn_list'),
    t('action.exportCsvColumn_name'),
    t('action.exportCsvColumn_description'),
    t('action.exportCsvColumn_assignees'),
    t('action.exportCsvColumn_labels'),
    t('action.exportCsvColumn_dueDate'),
    t('action.exportCsvColumn_completed'),
    t('action.exportCsvColumn_tasks'),
  ];

  const rows = cards.map((card) => [
    listMap[card.listId] || '',
    card.name,
    card.description || '',
    (card.users || []).map((u) => u.name).join(', '),
    (card.labels || []).map((l) => l.name || l.color).join(', '),
    formatDate(card.dueDate),
    card.isCompleted
      ? t('action.exportCsvColumn_completed_yes')
      : t('action.exportCsvColumn_completed_no'),
    card.tasks && card.tasks.length > 0
      ? `${card.tasks.filter((task) => task.isCompleted).length}/${card.tasks.length}`
      : '',
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeField).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${boardName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
