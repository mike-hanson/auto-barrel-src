

import * as assert from 'assert';
// import * as vscode from 'vscode';
// import { substitute } from 'jssubstitute';

import { BarrelBuilder } from '../../barrel-builder';

describe('BarrelBuilder', () => {
    let target: BarrelBuilder;

    beforeEach(() => {
        target = new BarrelBuilder();
    });

    it('should be defined', () => {
        assert.notEqual(typeof target, 'undefined');
    });

    it('should implement a method to build a barrel', () => {
        assert.equal(typeof target.build, 'function', 'build method not defined');
        assert.equal(target.build.length, 1, "build method does not define a required argument");
    });
});