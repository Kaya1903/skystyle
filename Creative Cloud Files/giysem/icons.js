// Minimal line-icon set. Each returns an inline SVG string, stroke-based to match the editorial style.
const S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  ust: `<svg viewBox="0 0 24 24" ${S}><path d="M8 3.5L4 6v4h2.5V20h11V10H20V6l-4-2.5c0 1.4-1.8 2.5-4 2.5s-4-1.1-4-2.5z"/></svg>`,
  ustune: `<svg viewBox="0 0 24 24" ${S}><path d="M9 3.5L5 6v3h2v10.5h3.3V8"/><path d="M15 3.5L19 6v3h-2v10.5h-3.3V8"/><path d="M9 3.5c0 1.3 1.3 2.2 3 2.2s3-.9 3-2.2"/></svg>`,
  dis: `<svg viewBox="0 0 24 24" ${S}><path d="M8.5 3L5 5.5V10h2.2v11h9.6V10H19V5.5L15.5 3"/><path d="M8.5 3c0 1.6 1.6 2.8 3.5 2.8S15.5 4.6 15.5 3"/><path d="M12 5.8V21"/></svg>`,
  alt: `<svg viewBox="0 0 24 24" ${S}><path d="M6.5 3.5h11L18 21h-3.2l-1.6-11-1.6 11H8.4L6.5 3.5z"/><path d="M6.7 7h10.6"/></svg>`,
  ayak: `<svg viewBox="0 0 24 24" ${S}><path d="M5 13.5V6a1.5 1.5 0 0 1 3 0c0 1.8 1.2 3 3 3.6l6 1.8c1.8.5 3 1.4 3 3.1 0 1.4-1.1 2.5-2.5 2.5H6A1.5 1.5 0 0 1 4.5 15.5"/><path d="M5 13.5h14"/></svg>`,
  yanina: `<svg viewBox="0 0 24 24" ${S}><path d="M12 3v1.5M4 13a8 8 0 0 1 16 0H4z"/><path d="M12 13v6.5a1.8 1.8 0 0 1-3.4.8"/></svg>`,
  location: `<svg viewBox="0 0 24 24" ${S}><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>`,
  search: `<svg viewBox="0 0 24 24" ${S}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-5-5"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" ${S}><path d="M12 5v14M5 12h14"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" ${S}><path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.4"/></svg>`,
  drop: `<svg viewBox="0 0 24 24" ${S}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>`,
  wind: `<svg viewBox="0 0 24 24" ${S}><path d="M3 8h11.5a2.5 2.5 0 1 0-2.3-3.5M3 12.5h15a2.5 2.5 0 1 1-2.3 3.5M3 17h9"/></svg>`,
  hanger: `<svg viewBox="0 0 24 24" ${S}><path d="M12 3a1.8 1.8 0 1 1 1.8 1.8"/><path d="M12 4.8V7"/><path d="M12 7l-8.5 6c-.6.4-.3 1.5.5 1.5h16c.8 0 1.1-1.1.5-1.5L12 7z"/><path d="M6 17.3h12"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" ${S}><path d="M9 6l6 6-6 6"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" ${S}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${S}><path d="M5 12.5l4.5 4.5L19 7"/></svg>`,
  user: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="8.2" r="3.6"/><path d="M4.5 20c0-3.6 3.4-6.2 7.5-6.2s7.5 2.6 7.5 6.2"/></svg>`,
};

export function icon(name, extraClass = '') {
  return `<span class="${extraClass}">${icons[name] || ''}</span>`;
}
