/** Inheritance data for responsive controls */
export interface IInheritanceData {
  /** Size value inherited from parent breakpoint */
  inheritedSize: string | null
  /** Unit inherited from parent breakpoint */
  inheritedUnit: string | null
  /** Source unit before conversion (e.g., 'fluid', 'px', 'custom') */
  sourceUnit: string | null
  /** Device name the value was inherited from */
  inheritedFrom: string | null
  /** Display-friendly device name */
  inheritedDevice: string | null
  /** Intermediate device in inheritance chain */
  inheritedVia: string | null
}
