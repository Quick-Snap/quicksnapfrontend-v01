/**
 * Body text for Web Share / clipboard when sharing an event.
 * Includes join (access) code when the API exposes it (e.g. organizer viewing their event).
 */
export function buildEventShareText(params: {
  name: string;
  description?: string | null;
  accessCode?: string | null;
  url: string;
}): string {
  const { name, description, accessCode, url } = params;
  const lines: string[] = [];
  const desc = description?.trim();
  if (desc) lines.push(desc);
  else lines.push(`You're invited to "${name}".`);
  if (accessCode?.trim()) lines.push(`Join code: ${accessCode.trim()}`);
  lines.push(url);
  return lines.join('\n\n');
}

/**
 * Formatted message text when client notifies photographer that their photo selection is ready.
 */
export function buildSelectionShareText(params: {
  eventName: string;
  clientName?: string | null;
  albumCount: number;
  keeperCount: number;
  url: string;
}): string {
  const { eventName, clientName, albumCount, keeperCount, url } = params;
  const greeting = clientName ? `Hey, this is ${clientName}!` : 'Hey!';
  const lines: string[] = [
    `${greeting} We have selected the photos for "${eventName}". 📸`,
    '',
    '✨ Our Selections:',
    `• ❤️ ${albumCount} Album ${albumCount === 1 ? 'pick' : 'picks'}`,
    `• 🔖 ${keeperCount} High-Res ${keeperCount === 1 ? 'Keeper' : 'Keepers'}`,
    '',
    'You can view our selections here:',
    url
  ];
  return lines.join('\n');
}
