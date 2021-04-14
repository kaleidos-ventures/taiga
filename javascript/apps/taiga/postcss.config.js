module.exports = {
  'plugins': [
    require('postcss-import')({
      from: "/src/styles.css"
    }),
    require('postcss-mixins'),
    require('postcss-preset-env')({
      stage: 0
    })
  ]
}
