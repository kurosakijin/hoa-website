const LOT_CATALOG = {
  '52': ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27'],
  '53': Array.from({ length: 50 }, (_, index) => String(index + 2)),
  '54': Array.from({ length: 28 }, (_, index) => String(index + 1)),
  '55': Array.from({ length: 20 }, (_, index) => String(index + 1)),
  '56': Array.from({ length: 20 }, (_, index) => String(index + 1)),
  '57': Array.from({ length: 20 }, (_, index) => String(index + 1)),
  '58': Array.from({ length: 20 }, (_, index) => String(index + 1)),
  '59': Array.from({ length: 24 }, (_, index) => String(index + 1)),
  '60': Array.from({ length: 20 }, (_, index) => String(index + 1)),
  '61': Array.from({ length: 20 }, (_, index) => String(index + 1)),
  '62': ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'],
};

function getAllowedLotsForBlock(block) {
  return LOT_CATALOG[String(block)] || [];
}

function isAllowedLotSelection(block, lotNumber) {
  return getAllowedLotsForBlock(block).includes(String(lotNumber));
}

module.exports = {
  LOT_CATALOG,
  getAllowedLotsForBlock,
  isAllowedLotSelection,
};
