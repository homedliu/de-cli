const request = require('@de-cli/request')

module.exports = function () {
  return request({
    url: '/project/template',
  })
}
