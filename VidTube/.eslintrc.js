module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: [
        '*.config.js',
        '.eslintrc.js',
      ],
      parserOptions: {
        requireConfigFile: false,
      },
    },
  ],
};
