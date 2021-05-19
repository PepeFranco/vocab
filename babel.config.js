module.exports = {
  plugins: ["./plugins/detectUntranslatedStrings.js"],
  presets: [
    ['@babel/preset-env', { targets: { node: '12' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
};
