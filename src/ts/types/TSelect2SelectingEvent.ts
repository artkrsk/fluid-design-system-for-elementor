/** Select2 selecting event with extended params */
export type TSelect2SelectingEvent = JQuery.TriggeredEvent & {
  params?: {
    args?: {
      originalEvent?: MouseEvent
    }
  }
}
