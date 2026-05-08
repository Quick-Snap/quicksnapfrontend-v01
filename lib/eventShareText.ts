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
