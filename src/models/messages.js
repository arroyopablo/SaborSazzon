const moment = require('moment');

function formatMessage(name, content) {
  return {
    name,
    content,
    time: moment().format('h:mm a'),
  };
}

module.exports = formatMessage;