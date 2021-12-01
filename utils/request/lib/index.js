'use strict'

const axios = require('axios')
const BASR_URL = process.env.DE_CLI_BASR_URL
  ? process.env.DE_CLI_BASR_URL
  : 'http://www.de-cli.com:7001'

const request = axios.create({
  baseURL: BASR_URL,
  timeout: 5000,
})

request.interceptors.response.use(
  (response) => {
    return response.data
    // if(response.status===200){

    // }else{

    // }
  },
  (error) => {
    return Promise.reject(error)
  }
)

module.exports = request
