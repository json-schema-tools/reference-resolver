const path = require('path');

module.exports = {
  entry: './build/index-web.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: {
      name: 'ReferenceResolver',
      type: 'window',
      export: 'default',
    },
  }
};
