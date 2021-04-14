import * as webpack from 'webpack';

export default function(config: webpack.WebpackOptions) {
  if (config.module) {
    config.module.rules.push(
      {
        test   : /\.css$/,
        loader : 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: [
              require('postcss-preset-env')(),
            ]
          }
        }
      }
    );
  }

  return config;
}
