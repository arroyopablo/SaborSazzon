const { Client } = require('pg')

const connectionString = {
  user: 'ukgerkfqbjoyxb',  
  password: '2e4f52321c055f56a6880dd07d259a0cf228d474ff18bcb0e66a700f357c5c65',
  database: 'dcep7v2k1ggvsr',  
  port: 5432,
  host: 'ec2-54-86-57-171.compute-1.amazonaws.com',
  ssl: {
    rejectUnauthorized: false
  }
}

const client = new Client(connectionString)

module.exports = { client };
