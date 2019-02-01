# Change Log

All notable changes to the "aut0-barrel" extension will be documented in this file.

Based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

### Changed

- Added support for including files in sub folders in barrel files

## [1.0.0] 2019-21-01

### Added

- Initial release

## [1.0.1] 2019-21-01

### Added

Added feedback for start command when it is executed and the extension is already started
Added feedback for stop command when it is executed and the extension is not started

### Fixed

Issue where an export for the barrel file was added to itself if it was created after the start command was executed
Issue where the stop command would generate an error if the extension had not been started

## [1.0.2] 2019-02-01

### Changed

Modified default watch glob to exclude files with .spec in the name

## [1.0.3] 2019-02-01

### Added

Populated CHANGELOG.md
New setting for list of path fragments that should be ignored with default of ".spec,.test" to ignore test files

### Changed

Reverted changes in [1.0.2] as it was unreliable
Create Barrel uses new setting to prevent files from being included in new barrel file
Start Command handler uses new setting to prevent new files from being added to existing barrel files
