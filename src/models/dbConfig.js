var pgp = require("pg-promise")(/*options*/);
var db = pgp("postgres://ukgerkfqbjoyxb:2e4f52321c055f56a6880dd07d259a0cf228d474ff18bcb0e66a700f357c5c65@ec2-54-86-57-171.compute-1.amazonaws.com:5432/dcep7v2k1ggvsr");

module.exports = { db };