/** Result of parsing a control name to extract device suffix */
export type TParsedControlName = {
  /** Base control name without device suffix (e.g., 'padding') */
  baseName: string
  /** Device suffix (e.g., 'tablet', 'mobile') or null for desktop */
  deviceSuffix: string | null
}
