const crypto = require('crypto');

function generateResidentCode() {
  return `HOA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

module.exports = {
  generateResidentCode,
};
