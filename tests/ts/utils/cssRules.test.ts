import { describe, it, expect } from 'vitest'
import {
  parseRulesFromText,
  formatRulesForStylesheet,
  filterRulesByVariable,
  createVariableRule,
  createUnsetRule
} from '@/utils/cssRules'

describe('cssRules utilities', () => {
  describe('parseRulesFromText', () => {
    it('parses single rule', () => {
      const cssText = ':root { --my-var: 16px; }'
      const rules = parseRulesFromText(cssText)

      expect(rules).toHaveLength(1)
      expect(rules[0]).toBe(':root { --my-var: 16px;')
    })

    it('parses multiple rules', () => {
      const cssText = ':root { --var-a: 10px; } :root { --var-b: 20px; }'
      const rules = parseRulesFromText(cssText)

      expect(rules).toHaveLength(2)
      expect(rules[0]).toBe(':root { --var-a: 10px;')
      expect(rules[1]).toBe(':root { --var-b: 20px;')
    })

    it('trims whitespace from rules', () => {
      const cssText = '   :root { --var: 16px; }   '
      const rules = parseRulesFromText(cssText)

      expect(rules[0]).toBe(':root { --var: 16px;')
    })

    it('filters out empty rules', () => {
      const cssText = ':root { --var: 16px; }  } } '
      const rules = parseRulesFromText(cssText)

      expect(rules).toHaveLength(1)
    })

    it('handles empty string', () => {
      const rules = parseRulesFromText('')

      expect(rules).toHaveLength(0)
    })

    it('handles string with only whitespace', () => {
      const rules = parseRulesFromText('   \n\t   ')

      expect(rules).toHaveLength(0)
    })

    it('handles complex CSS with nested braces in values', () => {
      const cssText = ':root { --var: clamp(16px, calc(1rem + 2vw), 24px); }'
      const rules = parseRulesFromText(cssText)

      // Split by } will create multiple parts
      expect(rules.length).toBeGreaterThanOrEqual(1)
    })

    it('handles multiple newlines between rules', () => {
      const cssText = ':root { --a: 1px; }\n\n\n:root { --b: 2px; }'
      const rules = parseRulesFromText(cssText)

      expect(rules).toHaveLength(2)
    })
  })

  describe('formatRulesForStylesheet', () => {
    it('adds closing brace to rule without one', () => {
      const rules = [':root { --var: 16px;']
      const result = formatRulesForStylesheet(rules)

      expect(result).toBe(':root { --var: 16px;}')
    })

    it('does not double closing brace', () => {
      const rules = [':root { --var: 16px; }']
      const result = formatRulesForStylesheet(rules)

      expect(result).toBe(':root { --var: 16px; }')
    })

    it('joins multiple rules', () => {
      const rules = [':root { --a: 10px;', ':root { --b: 20px;']
      const result = formatRulesForStylesheet(rules)

      expect(result).toBe(':root { --a: 10px;}:root { --b: 20px;}')
    })

    it('handles empty array', () => {
      const result = formatRulesForStylesheet([])

      expect(result).toBe('')
    })

    it('handles mixed rules (with and without closing braces)', () => {
      const rules = [':root { --a: 10px; }', ':root { --b: 20px;']
      const result = formatRulesForStylesheet(rules)

      expect(result).toBe(':root { --a: 10px; }:root { --b: 20px;}')
    })

    it('preserves rule content exactly', () => {
      const rules = [':root { --clamp-var: clamp(16px, calc(1rem + 2vw), 24px);']
      const result = formatRulesForStylesheet(rules)

      expect(result).toContain('clamp(16px, calc(1rem + 2vw), 24px)')
    })
  })

  describe('filterRulesByVariable', () => {
    it('removes rules containing specified variable', () => {
      const rules = [
        ':root { --var-a: 10px;',
        ':root { --var-b: 20px;',
        ':root { --var-a: 30px;'
      ]
      const filtered = filterRulesByVariable(rules, '--var-a')

      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toBe(':root { --var-b: 20px;')
    })

    it('returns all rules when variable not found', () => {
      const rules = [':root { --var-a: 10px;', ':root { --var-b: 20px;']
      const filtered = filterRulesByVariable(rules, '--var-c')

      expect(filtered).toHaveLength(2)
    })

    it('handles empty rules array', () => {
      const filtered = filterRulesByVariable([], '--var-a')

      expect(filtered).toHaveLength(0)
    })

    it('is case sensitive', () => {
      const rules = [':root { --Var-A: 10px;', ':root { --var-a: 20px;']
      const filtered = filterRulesByVariable(rules, '--var-a')

      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toBe(':root { --Var-A: 10px;')
    })

    it('filters partial variable name matches', () => {
      // Note: This tests actual behavior - partial matches ARE filtered
      const rules = [':root { --arts-fluid-preset-1: 10px;', ':root { --other: 20px;']
      const filtered = filterRulesByVariable(rules, '--arts-fluid')

      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toBe(':root { --other: 20px;')
    })

    it('removes unset rules for variable', () => {
      const rules = [
        ':root { --var-a: 10px;',
        ':root { --var-a: unset !important;',
        ':root { --var-b: 20px;'
      ]
      const filtered = filterRulesByVariable(rules, '--var-a')

      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toBe(':root { --var-b: 20px;')
    })
  })

  describe('createVariableRule', () => {
    it('creates variable rule with px value', () => {
      const rule = createVariableRule('--my-var', '16px')

      expect(rule).toBe(':root { --my-var: 16px; }')
    })

    it('creates variable rule with clamp value', () => {
      const rule = createVariableRule(
        '--fluid-size',
        'clamp(16px, calc(1rem + 2vw), 24px)'
      )

      expect(rule).toBe(':root { --fluid-size: clamp(16px, calc(1rem + 2vw), 24px); }')
    })

    it('creates variable rule with rem value', () => {
      const rule = createVariableRule('--spacing', '1.5rem')

      expect(rule).toBe(':root { --spacing: 1.5rem; }')
    })

    it('creates variable rule with color value', () => {
      const rule = createVariableRule('--primary-color', '#ff0000')

      expect(rule).toBe(':root { --primary-color: #ff0000; }')
    })

    it('creates variable rule with empty string value', () => {
      const rule = createVariableRule('--empty', '')

      expect(rule).toBe(':root { --empty: ; }')
    })

    it('handles CSS variable with full prefix', () => {
      const rule = createVariableRule('--arts-fluid-preset-heading-1', 'clamp(24px, 3vw, 48px)')

      expect(rule).toBe(':root { --arts-fluid-preset-heading-1: clamp(24px, 3vw, 48px); }')
    })
  })

  describe('createUnsetRule', () => {
    it('creates unset rule with !important', () => {
      const rule = createUnsetRule('--my-var')

      expect(rule).toBe(':root { --my-var: unset !important; }')
    })

    it('handles preset variable name', () => {
      const rule = createUnsetRule('--arts-fluid-preset-heading-1')

      expect(rule).toBe(':root { --arts-fluid-preset-heading-1: unset !important; }')
    })

    it('handles short variable name', () => {
      const rule = createUnsetRule('--x')

      expect(rule).toBe(':root { --x: unset !important; }')
    })
  })

  describe('integration: parse, filter, format', () => {
    it('roundtrips CSS through parse and format', () => {
      const original = ':root { --a: 10px; } :root { --b: 20px; }'
      const parsed = parseRulesFromText(original)
      const formatted = formatRulesForStylesheet(parsed)

      // Should produce valid CSS (even if slightly different format)
      expect(formatted).toContain('--a: 10px')
      expect(formatted).toContain('--b: 20px')
    })

    it('filters and reformats correctly', () => {
      const original = ':root { --keep: 10px; } :root { --remove: 20px; }'
      const parsed = parseRulesFromText(original)
      const filtered = filterRulesByVariable(parsed, '--remove')
      const formatted = formatRulesForStylesheet(filtered)

      expect(formatted).toContain('--keep')
      expect(formatted).not.toContain('--remove')
    })

    it('adds new rule to existing stylesheet', () => {
      const original = ':root { --existing: 10px; }'
      const parsed = parseRulesFromText(original)
      const newRule = createVariableRule('--new', '20px')
      const newRuleParsed = parseRulesFromText(newRule)
      const combined = [...parsed, ...newRuleParsed]
      const formatted = formatRulesForStylesheet(combined)

      expect(formatted).toContain('--existing')
      expect(formatted).toContain('--new')
    })
  })
})
