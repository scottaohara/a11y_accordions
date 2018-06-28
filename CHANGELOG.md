# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]
Optional feature to add support for up/down arrow keys

## [3.2.0] - 2018-06-28
### Added
- package.json and registered as NPM package.

### Changed
- `data-transition` attribute no longer allows for a value. Instead it merely adds a transition class to each accordion panel to allow for transitions for specific CSS properties to be customized in the CSS file.
- Instead of requiring `.js` prior to CSS selectors, remove this `.js` selector dependency and have the base markup utilize data attributes. When the script runs on page load, the classes that were there by default will now be applied by the script.

## [3.1.1] - 2018-06-11
### Added
- Add "arrows" for accordion trigger styling.


## [3.1.0] - 2018-02-09
### Changed
- [Modify the manner in which IDs are generated](https://github.com/scottaohara/a11y_accordions/commit/5723fafddac2dcbf102a0f99bd9f6d3b2e676dd1).


## [3.0.0] - 2018-02-09
### Added
- CSS to ensure list semantics are respected with Safari + VoiceOver.

### Changed
- Updated documentation and notes about screen reader usability.
- Allow accordions to have an `ol` or `ul` base markup pattern.
- Fix bug with multi-accordion panels.


## [2.0.1] - 2017-10-27
### Changed
- NaN bug fix.


## [2.0.0] - 2017-10-24
### Changed
- Converted script from jQuery to ES5 Vanilla JavaScript.

### Removed
- jQuery dependency
- CSS :target selector for no-js functionality. Instead the no-js functionality should just be the static underlying markup.


## 1.0.2 - 2017-10-24
### Added
- CSS :target selector for no-js functionality

### Changed
- Fix spacebar bug with Firefox
- Modified styling selectors
- Smarter selectors for nesting of accordion widgets
- Timeout function to mitigate Firefox animation issue
