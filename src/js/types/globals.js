/* eslint-disable */
// @ts-nocheck

/**
 * @typedef {Object} ElementorCommands
 * @property {function(string, any): Promise<any>} run - Run an Elementor command
 * @property {function(string, Function): void} register - Register a new command
 */

/**
 * @typedef {Object} ElementorHooks
 * @property {function(any): void} registerUIAfter - Register an after hook
 * @property {function(any): void} registerUIBefore - Register a before hook
 */

/**
 * @typedef {Object} ElementorHookUI
 * @property {any} After - After hook class
 * @property {any} Before - Before hook class
 */

/**
 * @typedef {Object} ElementorModules
 * @property {ElementorHookUI} hookUI - Hook UI modules
 * @property {any} ComponentBase - Base class for components
 */

/**
 * @typedef {Object} ElementorE
 * @property {ElementorCommands} commands - Elementor commands
 * @property {ElementorHooks} hooks - Elementor hooks
 * @property {ElementorModules} modules - Elementor modules
 * @property {Object} components - Elementor components
 * @property {function(any): void} components.register - Register a component
 */

/**
 * @typedef {Object} ElementorControls
 * @property {any} Base - Base control class
 * @property {any} RepeaterRow - Repeater row control
 * @property {any} GlobalStyleRepeater - Global style repeater control
 * @property {any} Dimensions - Dimensions control
 * @property {any} Gaps - Gaps control
 * @property {any} Slider - Slider control
 */

/**
 * @typedef {Object} ElementorModulesControls
 * @property {ElementorControls} controls - Elementor controls
 */

/**
 * @typedef {Object} Elementor
 * @property {ElementorModulesControls} modules - Elementor modules
 * @property {function(string, any): void} addControlView - Add a control view
 * @property {function(string, string): string} translate - Translate text
 * @property {JQuery<HTMLIFrameElement>} $preview - Elementor preview frame
 * @property {Object} ajax - Elementor AJAX utilities
 * @property {function(string, Object): void} ajax.addRequest - Add an AJAX request
 * @property {Object} breakpoints - Breakpoint utilities
 * @property {function(Object): Array<string>} breakpoints.getActiveBreakpointsList - Get active breakpoints list
 */

/**
 * @typedef {Object} ElementorCommonDialogs
 * @property {function(string, any): any} createWidget - Create a dialog widget
 */

/**
 * @typedef {Object} ElementorCommon
 * @property {ElementorCommonDialogs} dialogsManager - Dialog manager
 */

/**
 * @typedef {Object} Backbone
 * @property {Object} View - Backbone View class
 * @property {Object} Model - Backbone Model class
 * @property {Object} Collection - Backbone Collection class
 * @property {Object} Events - Backbone Events mixin
 * @property {Object} __super__ - Parent class prototype
 */

/**
 * @typedef {Object} BackboneView
 * @property {function(): Object} ui - Returns UI selectors
 * @property {function(): Object} events - Returns event handlers
 * @property {function(): void} initialize - Initializes the view
 * @property {function(): void} render - Renders the view
 * @property {function(string, any): void} listenTo - Listens to events
 * @property {function(string, any): void} trigger - Triggers events
 * @property {Object} model - The view's model
 * @property {Object} collection - The view's collection
 * @property {Array<BackboneView>} children - Child views
 * @property {BackboneView} _parent - Parent view
 * @property {Object} ui.resetButton - Reset button selector
 * @property {Object} ui.removeButton - Remove button selector
 * @property {function(): void} onRemoveButtonClick - Handles remove button click
 * @property {function(BackboneView): void} onChildviewRender - Handles child view render
 * @property {function(): Object} templateHelpers - Returns template helpers
 * @property {function(): Object} getDefaults - Returns default values
 */

// Declare globals
/** @type {ElementorE} */
var $e = window.$e || {}

/** @type {Elementor} */
var elementor = window.elementor || {}

/** @type {ElementorCommon} */
var elementorCommon = window.elementorCommon || {}

/** @type {JQueryStatic} */
var jQuery = window.jQuery || {}

/** @type {any} */
var Backbone = window.Backbone || {}

/** @type {any} */
var _ = window._ || {}

var ArtsFluidDSStrings = window.ArtsFluidDSStrings || {}
