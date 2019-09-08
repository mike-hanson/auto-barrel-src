import { assert } from 'chai';
import { Substitute, Arg, SubstituteOf } from '@testpossessed/ts-substitute';

import { IConfiguration } from '../../abstractions/configuration.interface';
import { Utility } from '../../utility';
import { defaultSettings } from '../../default-settings';
import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';

describe('Utility', () => {
  let configuration: SubstituteOf<IConfiguration>;
  let vsCodeApi: SubstituteOf<IVsCodeApi>;
  let target: Utility;

  beforeEach(() => {
    vsCodeApi = Substitute.for<IVsCodeApi>();
    configuration = Substitute.for<IConfiguration>();
    target = new Utility(configuration, vsCodeApi);
  });

  it('should be defined', () => {
    assert.isDefined(target);
  });

  it('should implement a method to get build an alias for a file', () => {
    assert.isFunction(target.buildAlias);
    assert.equal(target.buildAlias.length, 1);
  });

  it('should implement a method to determine whether a file contains a default export', () => {
    assert.isFunction(target.containsDefaultExport);
    assert.equal(target.containsDefaultExport.length, 1);
  });

  it('should implement a method to find the closest barrel to a file', () => {
    assert.isFunction(target.findClosestBarrel);
    assert.equal(target.findClosestBarrel.length, 1);
  });

  it('should implement a method to get language extension', () => {
    assert.isFunction(target.getLanguageExtension);
    assert.equal(target.getLanguageExtension.length, 1);
  });

  it('should implement a method to determine whether a file is exclude by config', () => {
    assert.isFunction(target.pathContainsIgnoredFragment);
    assert.equal(target.pathContainsIgnoredFragment.length, 1);
  });

  it('should implement a method to determine whether a file should be included in a barrel', () => {
    assert.isFunction(target.shouldBeIncludedInBarrel);
    assert.equal(target.shouldBeIncludedInBarrel.length, 2);
  });

  describe('buildAlias', () => {
    it('should return correct alias for simple file name', () => {
      assert.equal(target.buildAlias('name.ext'), 'Name');
    });

    it('should return correct alias for file name with hyphens to separate words', () => {
      assert.equal(target.buildAlias('my-name.ext'), 'MyName');
    });

    it('should return correct alias for file name with multiple dot seprated parts', () => {
      assert.equal(target.buildAlias('my.name.ext'), 'MyName');
    });

    it('should return correct alias for barrel file in nested folder', () => {
      assert.equal(target.buildAlias('src/sub1/sub2/index.ts'), 'Sub2');
    });
  });

  describe('containsDefaultExport', () => {
    it('should return correct result for file with default export', async () => {
      vsCodeApi.getDocumentText('test1.ts').returnsAsync('testing \nexport default Test1');

      const actual = await target.containsDefaultExport('test1.ts');
      assert.isTrue(actual);
    });

    it('should return correct result for file without default export', async () => {
      vsCodeApi.getDocumentText('test1.ts').returnsAsync('testing testing testing...');

      const actual = await target.containsDefaultExport('test1.ts');
      assert.isFalse(actual);
    });
  });

  describe('findClosestBarrel', () => {
    it('should look for barrels within scope of watch glob config', () => {
      assumeDefaultConfiguration();

      target.findClosestBarrel('/c:/barrel/test1.ts');

      vsCodeApi.received().findFiles('src/**/index.ts');
    });

    it('should match barrel in same folder', async () => {
      assumeDefaultConfiguration();

      const matchedFiles: Array<string> = [
        '/c:/src/barrel/index.ts',
        '/c:/src/barrel/sub/index.ts',
        ,
        '/c:/src/barrel/sub/nested/index.ts',
        '/c:/src/barrel/sub/sub/index.ts'
      ];

      vsCodeApi.findFiles(Arg.any('String')).returnsAsync(matchedFiles);

      const expected: string = '/c:/src/barrel/sub/sub/index.ts';

      const actual = await target.findClosestBarrel('/c:/src/barrel/sub/sub/test1.ts');

      assert.equal(actual, expected);
    });

    it('should match barrel in parent folder', async () => {
      assumeDefaultConfiguration();

      const matchedFiles: Array<string> = [
        '/c:/src/barrel/index.ts',
        ,
        '/c:/src/barrel/sub/nested/index.ts',
        '/c:/src/barrel/sub/index.ts'
      ];

      vsCodeApi.findFiles(Arg.any('String')).returnsAsync(matchedFiles);

      const expected: string = '/c:/src/barrel/sub/index.ts';

      const actual = await target.findClosestBarrel('/c:/src/barrel/sub/sub/test1.ts');

      assert.equal(actual, expected);
    });

    it('should match barrel in grand parent folder', async () => {
      assumeDefaultConfiguration();

      const matchedFiles: Array<string> = ['/c:/src/barrel/index.ts', '/c:/src/barrel/sub/nested/index.ts'];

      vsCodeApi.findFiles(Arg.any('String')).returnsAsync(matchedFiles);

      const expected: string = '/c:/src/barrel/index.ts';

      const actual = await target.findClosestBarrel('/c:/src/barrel/sub/sub/test1.ts');

      assert.equal(actual, expected);
    });

    it('should match barrel in same folder when recursive barrelling disaabled', async () => {
      const config = Object.assign({}, defaultSettings);
      config.disableRecursiveBarrelling = true;
      configuration.current.returns(config);

      const matchedFiles: Array<string> = ['/c:/src/barrel/sub/sub/index.ts'];

      vsCodeApi.findFiles(Arg.any('String')).returnsAsync(matchedFiles);

      const expected: string = '/c:/src/barrel/sub/sub/index.ts';

      const actual = await target.findClosestBarrel('/c:/src/barrel/sub/sub/test1.ts');

      assert.equal(actual, expected);
    });

    it('should return nothing when recursive barrelling disaabled and no barrel file in same folder', async () => {
      const config = Object.assign({}, defaultSettings);
      config.disableRecursiveBarrelling = true;
      configuration.current.returns(config);

      const matchedFiles: Array<string> = [];

      vsCodeApi.findFiles(Arg.any('String')).returnsAsync(matchedFiles);

      const actual = await target.findClosestBarrel('/c:/src/barrel/sub/sub/test1.ts');

      assert.equal(actual, undefined);
    });
  });

  describe('getLanguageExtension', () => {
    it('should return correct extension when all files have .ts extension', () => {
      assumeDefaultConfiguration();

      const filePaths: Array<string> = ['C:\\barrel\\test1.ts', 'C:\\barrel\\test2.ts', 'C:\\barrel\\test3.ts'];

      assert.equal(target.getLanguageExtension(filePaths), 'ts');
    });

    it('should return correct extension when all files have .js extension', () => {
      assumeDefaultConfiguration();

      const filePaths: Array<string> = ['C:\\barrel\\test1.js', 'C:\\barrel\\test2.js', 'C:\\barrel\\test3.js'];

      assert.equal(target.getLanguageExtension(filePaths), 'js');
    });

    it('should return default extension if configured to always use default', () => {
      const config = Object.assign({}, defaultSettings);
      config.alwaysUseDefaultLanguage = true;
      configuration.current.returns(config);

      const filePaths: Array<string> = ['C:\\barrel\\test1.ts', 'C:\\barrel\\test2.ts', 'C:\\barrel\\test3.ts'];

      assert.equal(target.getLanguageExtension(filePaths), config.defaultExtension);
    });

    it('should return default extension if file extensions are mixed', () => {
      assumeDefaultConfiguration();

      const filePaths: Array<string> = ['C:\\barrel\\test1.ts', 'C:\\barrel\\test2.js', 'C:\\barrel\\test3.ts'];
      assert.equal(target.getLanguageExtension(filePaths), defaultSettings.defaultExtension);
    });
  });

  describe('getLanguageExtensionFromFile', () => {
    it('should return correct extension when file .ts extension', () => {
      assumeDefaultConfiguration();

      const filePath = 'C:\\barrel\\test1.ts';

      assert.equal(target.getLanguageExtensionFromFile(filePath), 'ts');
    });

    it('should return correct extension when file has .js extension', () => {
      assumeDefaultConfiguration();

      const filePath = 'C:\\barrel\\test1.js';

      assert.equal(target.getLanguageExtensionFromFile(filePath), 'js');
    });

    it('should return default extension if configured to always use default', () => {
      const config = Object.assign({}, defaultSettings);
      config.alwaysUseDefaultLanguage = true;
      configuration.current.returns(config);

      const filePath = 'C:\\barrel\\test1.ts';

      assert.equal(target.getLanguageExtensionFromFile(filePath), config.defaultExtension);
    });
  });

  describe('pathContainsIgnoredFragment', () => {
    it('should return true if file path contains any excluded fragment', () => {
      assumeDefaultConfiguration();

      assert.equal(target.pathContainsIgnoredFragment('some.test.ts'), true);
    });

    it('should return false if file path does not contain any excluded fragment', () => {
      assumeDefaultConfiguration();

      assert.equal(target.pathContainsIgnoredFragment('some.class.ts'), false);
    });
  });

  describe('shouldBeIncludedInBarrrel', () => {
    it('should return true for file with supported extension and no excluded fragment', () => {
      assumeDefaultConfiguration();

      assert.isTrue(target.shouldBeIncludedInBarrel('some.class.ts', 'ts'));
      assert.isTrue(target.shouldBeIncludedInBarrel('some.class.tsx', 'ts'));
      assert.isTrue(target.shouldBeIncludedInBarrel('some.class.js', 'js'));
      assert.isTrue(target.shouldBeIncludedInBarrel('some.class.jsx', 'js'));
    });

    it('should return false for file with unsupported extension', () => {
      assumeDefaultConfiguration();

      assert.isFalse(target.shouldBeIncludedInBarrel('some.class.vs', 'ts'));
      assert.isFalse(target.shouldBeIncludedInBarrel('some.class.vs', 'js'));
    });

    it('should return false for file with supported extension but excluded fragment', () => {
      assumeDefaultConfiguration();

      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.ts', 'ts'));
      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.tsx', 'ts'));
      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.js', 'js'));
      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.jsx', 'js'));
    });

    it('should return false for file with supported extension but does not match language extension', () => {
      assumeDefaultConfiguration();

      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.ts', 'js'));
      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.tsx', 'js'));
      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.js', 'ts'));
      assert.isFalse(target.shouldBeIncludedInBarrel('some.test.jsx', 'ts'));
    });
  });

  function assumeDefaultConfiguration() {
    configuration.current.returns(defaultSettings);
  }
});
