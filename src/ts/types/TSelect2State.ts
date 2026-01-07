/** Select2 option data structure */
export type TSelect2OptionData = {
  id: string
  text: string
  element?: HTMLOptionElement
  disabled?: boolean
  selected?: boolean
  children?: TSelect2OptionData[]
}

/** Select2 loading data */
export type TSelect2LoadingData = {
  loading: boolean
  text: string
  element?: undefined
}

/** Select2 optgroup data */
export type TSelect2OptGroupData = {
  text: string
  children: TSelect2OptionData[]
  element?: HTMLOptGroupElement
}

/** Combined Select2 state type */
export type TSelect2State = TSelect2OptionData | TSelect2LoadingData | TSelect2OptGroupData

/** Select2 matcher data (excludes loading state) */
export type TSelect2MatcherData = TSelect2OptionData | TSelect2OptGroupData

/** Select2 search options */
export type TSelect2SearchOptions = {
  term: string
}
