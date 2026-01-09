import type { TParsedValue } from './TParsedValue'

/** Validation result */
export type TValidationResult = {
  valid: boolean
  error?: string
  values?: {
    minParsed: TParsedValue
    maxParsed: TParsedValue
  }
}
