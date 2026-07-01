const POSITION_MAP: Record<string, string> = {
  goalkeeper: 'GK',
  'centre-back': 'CB',
  'center-back': 'CB',
  'left-back': 'LB',
  'right-back': 'RB',
  defence: 'DF',
  defender: 'DF',
  'defensive midfield': 'DM',
  'attacking midfield': 'AM',
  midfield: 'CM',
  midfielder: 'CM',
  'centre-forward': 'ST',
  'center-forward': 'ST',
  'right winger': 'RW',
  'left winger': 'LW',
  offence: 'FW',
  forward: 'FW',
  attacker: 'FW',
  winger: 'WG',
}

export const positionAbbrev = (position?: string | null) => {
  if (!position) return '—'
  const key = position.trim().toLowerCase()
  if (POSITION_MAP[key]) return POSITION_MAP[key]
  for (const [needle, abbrev] of Object.entries(POSITION_MAP)) {
    if (key.includes(needle)) return abbrev
  }
  return position
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
}
