module.exports = (wallaby) => {

    return {
        files: [
            { pattern: 'node_modules/reflect-metadata/Reflect.js', instrument: false },
            'src/*.ts',
            'src/abstractions/*.ts'
        ],
        tests: [
            'src/test/unit/*.test.ts'
        ],
        env: {
            type: 'node',
            runner: 'node'
        },
        compilers: {
            'src/**/*.ts': wallaby.compilers.typeScript()
        },
        testFramework: 'jasmine',
        debug: true
    };
}