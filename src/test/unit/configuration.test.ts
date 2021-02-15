import { assert } from 'chai';
import { Substitute, SubstituteOf } from '@testpossessed/ts-substitute';

import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';
import { defaultSettings } from '../../default-settings';
import { Configuration } from '../../configuration';
import { AutoBarrelSettings } from '../../models/auto-barrel-settings';

describe('Configuration', () => {
  let vsCodeApiMock: SubstituteOf<IVsCodeApi>;
  let target: Configuration;

  beforeEach(() => {
    vsCodeApiMock = Substitute.for<IVsCodeApi>();
    target = new Configuration(vsCodeApiMock);
  });

  it('should be defined', () => {
    assert.isDefined(target);
  });

  it('should return default settings for current', () => {
    assumeConfigReturnsDefaultSettings();

    assert.equal(target.current, defaultSettings);
  });

  it('should return correct default for defaultExtension', () => {
    assumeConfigReturnsDefaultSettings();

    assert.equal(target.defaultExtension, defaultSettings.defaultExtension);
  });

  it('should return correct default for alwaysUseDefaultLanguage', () => {
    assumeConfigReturnsDefaultSettings();

    assert.equal(target.alwaysUseDefaultLanguage, defaultSettings.alwaysUseDefaultLanguage);
  });

  it('should return correct default for watchGlob', () => {
    assumeConfigReturnsDefaultSettings();

    assert.equal(target.watchGlob, defaultSettings.watchGlob);
  });

  it('should return correct default for ingnoreFilePathContainingAnyOf', () => {
    assumeConfigReturnsDefaultSettings();

    assert.equal(target.ignoreFilePathContainingAnyOf, defaultSettings.ignoreFilePathContainingAnyOf);
  });

  it('should return correct default for useImportAliasExportPattern', () => {
    assumeConfigReturnsDefaultSettings();

    assert.equal(target.useImportAliasExportPattern, defaultSettings.useImportAliasExportPattern);
  });

  it('should return correct default for disableRecursiveBarrelling', () => {
    assumeConfigReturnsDefaultSettings();

    assert.equal(target.disableRecursiveBarrelling, defaultSettings.disableRecursiveBarrelling);
  });

  it('should return value from VS Code configuration for defaultExtension', () => {
    assumeConfigReturnsValue<string>('defaultExtension', 'js');

    assert.equal(target.defaultExtension, 'js');
  });

  it('should return value from VS Code configuration for alwaysUseDefaultLanguage', () => {
    assumeConfigReturnsValue<boolean>('alwaysUseDefaultLanguage', true);

    assert.equal(target.alwaysUseDefaultLanguage, true);
  });

  it('should return value from VS Code configuration for watchGlob', () => {
    const expected = 'somethingElse';
    assumeConfigReturnsValue<string>('watchGlob', expected);

    assert.equal(target.watchGlob, expected);
  });

  it('should return value from VS Code configuration for ignoreFilePathContainingAnyOf', () => {
    const expected = 'somethingElse';
    assumeConfigReturnsValue<string>('ignoreFilePathContainingAnyOf', expected);

    assert.equal(target.ignoreFilePathContainingAnyOf, expected);
  });

  it('should return value from VS Code configuration for useImportAliasExportPattern', () => {
    assumeConfigReturnsValue<boolean>('useImportAliasExportPattern', true);

    assert.equal(target.useImportAliasExportPattern, true);
  });

  it('should return value from VS Code configuration for disableRecursiveBarrelling', () => {
    assumeConfigReturnsValue<boolean>('disableRecursiveBarrelling', true);

    assert.equal(target.disableRecursiveBarrelling, true);
  });

  it('should return updated settings from configuration for current', () => {
    const expected: AutoBarrelSettings = {
      defaultExtension: 'js',
      alwaysUseDefaultLanguage: true,
      watchGlob: 'watchGlob',
      ignoreFilePathContainingAnyOf: 'ignore',
      useImportAliasExportPattern: true,
      disableRecursiveBarrelling: true,
      excludeSemiColonAtEndOfLine: false,
      includeExtensionOnExport: '.vue'
    };
    vsCodeApiMock.getConfiguration().returns(expected);

    assert.equal(target.current, expected);
  });

  function assumeConfigReturnsDefaultSettings() {
    vsCodeApiMock.getConfiguration().returns(defaultSettings);
  }

  function assumeConfigReturnsValue<T extends string | boolean>(section: string, value: T) {
    const baseSettings = Object.assign({}, defaultSettings);
    baseSettings[section] = value;

    vsCodeApiMock.getConfiguration().returns(baseSettings);
  }
});
