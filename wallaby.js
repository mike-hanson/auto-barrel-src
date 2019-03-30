module.exports = (wallaby) => {

    return {
        files: [
            { pattern: 'src/*.ts', load: false },
            { pattern: 'src/abstractions/*.ts', load: false }
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
        debug: true
    };
}