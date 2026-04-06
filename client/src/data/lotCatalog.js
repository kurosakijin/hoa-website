export const LOT_CATALOG = {
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

export const BLOCK_OPTIONS = Object.keys(LOT_CATALOG);

export function buildLotKey(block, lotNumber) {
  return `${String(block)}:${String(lotNumber)}`;
}

function isAssignableLot({ block, lotNumber, occupiedLotKeys, selectedLotKeys, currentKey }) {
  const lotKey = buildLotKey(block, lotNumber);

  return lotKey === currentKey || (!occupiedLotKeys.has(lotKey) && !selectedLotKeys.has(lotKey));
}

export function getBlockOptions(currentBlock) {
  if (currentBlock && !LOT_CATALOG[currentBlock]) {
    return [currentBlock, ...BLOCK_OPTIONS];
  }

  return BLOCK_OPTIONS;
}

export function getLotOptions(block, currentLotNumber) {
  const options = LOT_CATALOG[String(block)] || [];
  const currentValue = currentLotNumber ? String(currentLotNumber) : '';

  if (currentValue && !options.includes(currentValue)) {
    return [currentValue, ...options];
  }

  return options;
}

export function getAvailableBlockOptions({
  occupiedLotKeys = new Set(),
  selectedLotKeys = new Set(),
  currentBlock,
  currentLotNumber,
} = {}) {
  const currentKey = currentBlock && currentLotNumber ? buildLotKey(currentBlock, currentLotNumber) : '';

  const options = BLOCK_OPTIONS.filter((block) =>
    LOT_CATALOG[block].some((lotNumber) =>
      isAssignableLot({
        block,
        lotNumber,
        occupiedLotKeys,
        selectedLotKeys,
        currentKey,
      })
    )
  );

  if (currentBlock && !options.includes(String(currentBlock))) {
    return [String(currentBlock), ...options];
  }

  return options;
}

export function getAvailableLotOptions({
  block,
  currentLotNumber,
  occupiedLotKeys = new Set(),
  selectedLotKeys = new Set(),
} = {}) {
  const blockValue = String(block || '');
  const options = LOT_CATALOG[blockValue] || [];
  const currentValue = currentLotNumber ? String(currentLotNumber) : '';
  const currentKey = blockValue && currentValue ? buildLotKey(blockValue, currentValue) : '';

  const filteredOptions = options.filter((lotNumber) =>
    isAssignableLot({
      block: blockValue,
      lotNumber,
      occupiedLotKeys,
      selectedLotKeys,
      currentKey,
    })
  );

  if (currentValue && !filteredOptions.includes(currentValue)) {
    return [currentValue, ...filteredOptions];
  }

  return filteredOptions;
}
