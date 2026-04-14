const Resident = require('../models/Resident');
const Payment = require('../models/Payment');
const { residents: seedResidents, payments: seedPayments } = require('../data/seedData');
const { LOT_CATALOG, isAllowedLotSelection } = require('../data/lotCatalog');
const { generateResidentCode } = require('../utils/ids');
const {
  DEFAULT_INTEREST_YEARS,
  DEFAULT_SQUARE_METERS,
  calculateLotPricing,
  derivePricePerSquareMeter,
  normalizeInterestYears,
  roundCurrency,
} = require('../utils/lotPricing');
const { sanitizeContactNumber } = require('../utils/contactNumber');
const {
  sanitizeMiddleName,
  formatResidentFullName,
  formatResidentSortableName,
} = require('../utils/middleInitial');
const {
  getPaymentEvidenceLabel,
  normalizePaymentMethod,
} = require('../utils/paymentEvidence');
const { uploadImageBuffer, deleteImage } = require('../lib/cloudinary');
const {
  deleteResidentChatThread,
  syncResidentChatThread,
} = require('./chatService');

const PAYMENT_TYPES = ['Monthly Dues', 'Advance Pay'];

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeCurrency(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function assertPaymentAmountValid(value) {
  if (!(Number(value) > 0)) {
    throw new Error('Payment amount must be greater than zero.');
  }
}

function normalizePaymentType(value) {
  const normalized = trimValue(value);
  return PAYMENT_TYPES.includes(normalized) ? normalized : 'Monthly Dues';
}

function normalizeLotInput(lot) {
  const normalizedSquareMeters =
    lot.squareMeters === '' || lot.squareMeters == null ? DEFAULT_SQUARE_METERS : lot.squareMeters;
  const pricing = calculateLotPricing({
    squareMeters: normalizedSquareMeters,
    pricePerSquareMeter: lot.pricePerSquareMeter,
    isSpotCash: lot.isSpotCash,
    interestYears: lot.interestYears,
  });

  return {
    _id: lot.id || lot._id,
    block: trimValue(lot.block),
    lotNumber: trimValue(lot.lotNumber),
    squareMeters: pricing.squareMeters,
    pricePerSquareMeter: pricing.pricePerSquareMeter,
    isSpotCash: pricing.isSpotCash,
    interestYears: pricing.interestYears,
    totalBalance: pricing.totalBalance,
    remainingBalance: pricing.totalBalance,
    isActive: lot.isActive !== false,
  };
}

function normalizeResidentInput(payload = {}) {
  return {
    residentCode: trimValue(payload.residentCode),
    firstName: trimValue(payload.firstName),
    middleName: sanitizeMiddleName(payload.middleName || payload.middleInitial),
    lastName: trimValue(payload.lastName),
    contactNumber: sanitizeContactNumber(payload.contactNumber),
    address: trimValue(payload.address),
    isActive: payload.isActive !== false,
    lots: Array.isArray(payload.lots) ? payload.lots.map(normalizeLotInput).filter((lot) => lot.block && lot.lotNumber) : [],
  };
}

async function uploadResidentProfileImage(file) {
  return uploadImageBuffer(file, 'resident-profiles');
}

async function uploadPaymentReceiptImage(file) {
  return uploadImageBuffer(file, 'payment-receipts');
}

async function deletePaymentReceiptAssets(payments) {
  await Promise.all(
    payments
      .map((payment) => payment.receiptImagePublicId)
      .filter(Boolean)
      .map((publicId) => deleteImage(publicId))
  );
}

function getResidentName(resident) {
  return formatResidentSortableName(resident);
}

function getResidentFullName(resident) {
  return formatResidentFullName(resident);
}

function isLotFullyPaid(lot) {
  return normalizeCurrency(lot?.totalBalance) > 0 && normalizeCurrency(lot?.remainingBalance) <= 0;
}

function toPlainLot(lot) {
  return {
    id: lot._id.toString(),
    block: lot.block,
    lotNumber: lot.lotNumber,
    squareMeters: lot.squareMeters,
    pricePerSquareMeter: lot.pricePerSquareMeter || 0,
    isSpotCash: lot.isSpotCash === true,
    interestYears: normalizeInterestYears(lot.interestYears),
    totalBalance: lot.totalBalance,
    remainingBalance: lot.remainingBalance,
    isActive: lot.isActive,
    isLocked: isLotFullyPaid(lot),
  };
}

function toResidentSummary(resident) {
  const lots = resident.lots.map(toPlainLot);
  const totalBalance = lots.reduce((sum, lot) => sum + lot.totalBalance, 0);
  const remainingBalance = lots.reduce((sum, lot) => sum + lot.remainingBalance, 0);

  return {
    id: resident._id.toString(),
    residentCode: resident.residentCode,
    firstName: resident.firstName,
    middleName: sanitizeMiddleName(resident.middleName || resident.middleInitial),
    lastName: resident.lastName,
    fullName: getResidentFullName(resident),
    contactNumber: sanitizeContactNumber(resident.contactNumber),
    address: resident.address,
    profileImageUrl: resident.profileImageUrl || '',
    isActive: resident.isActive,
    totalBalance,
    remainingBalance,
    activeLots: lots.filter((lot) => lot.isActive).length,
    lots,
    createdAt: resident.createdAt,
    updatedAt: resident.updatedAt,
  };
}

function toPaymentSummary(payment) {
  return {
    id: payment._id.toString(),
    residentId: payment.resident.toString(),
    residentCode: payment.residentCode,
    residentName: payment.residentName,
    lotId: payment.lotId,
    block: payment.block,
    lotNumber: payment.lotNumber,
    squareMeters: payment.squareMeters,
    amount: payment.amount,
    type: payment.type,
    method: payment.method,
    evidenceLabel: getPaymentEvidenceLabel(payment.method),
    receiptImageUrl: payment.receiptImageUrl || '',
    notes: payment.notes,
    paymentDate: payment.paymentDate.toISOString(),
    createdAt: payment.createdAt,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatLotLabel(block, lotNumber) {
  return `Block ${block} / Lot ${lotNumber}`;
}

function findLockedLotConflict(existingResident, nextLots) {
  const nextLotsById = new Map(
    nextLots
      .filter((lot) => lot?._id)
      .map((lot) => [lot._id.toString(), lot])
  );

  for (const existingLot of existingResident.lots) {
    if (!isLotFullyPaid(existingLot)) {
      continue;
    }

    const lockedLotId = existingLot._id.toString();
    const nextLot = nextLotsById.get(lockedLotId);

    if (!nextLot) {
      return `Fully paid ${formatLotLabel(existingLot.block, existingLot.lotNumber)} is locked and cannot be forfeited or removed.`;
    }

    const lotWasChanged =
      String(existingLot.block) !== String(nextLot.block) ||
      String(existingLot.lotNumber) !== String(nextLot.lotNumber) ||
      Number(existingLot.squareMeters) !== Number(nextLot.squareMeters) ||
      Number(existingLot.pricePerSquareMeter || 0) !== Number(nextLot.pricePerSquareMeter || 0) ||
      Boolean(existingLot.isSpotCash) !== Boolean(nextLot.isSpotCash) ||
      normalizeInterestYears(existingLot.interestYears) !== normalizeInterestYears(nextLot.interestYears) ||
      nextLot.isActive === false;

    if (lotWasChanged) {
      return `Fully paid ${formatLotLabel(existingLot.block, existingLot.lotNumber)} is locked and cannot be changed.`;
    }
  }

  return '';
}

function assertLotFinancialsValid(lots) {
  for (const lot of lots) {
    if (!lot.squareMeters) {
      throw new Error(`Square meters must be greater than zero for ${formatLotLabel(lot.block, lot.lotNumber)}.`);
    }

    if (!lot.pricePerSquareMeter) {
      throw new Error(
        `Price per square meter must be greater than zero for ${formatLotLabel(lot.block, lot.lotNumber)}.`
      );
    }
  }
}

function isExistingLotUnchanged(existingResident, lot) {
  if (!existingResident || !lot._id) {
    return false;
  }

  const existingLot = existingResident.lots.id(lot._id);

  if (!existingLot) {
    return false;
  }

  return (
    String(existingLot.block) === String(lot.block) &&
    String(existingLot.lotNumber) === String(lot.lotNumber)
  );
}

async function assertLotAssignmentsValid(lots, currentResident = null) {
  const seen = new Set();

  for (const lot of lots) {
    const block = String(lot.block);
    const lotNumber = String(lot.lotNumber);
    const lotKey = `${block}:${lotNumber}`;

    if (seen.has(lotKey)) {
      throw new Error(`Duplicate lot assignment detected for ${formatLotLabel(block, lotNumber)}.`);
    }

    seen.add(lotKey);

    if (!isAllowedLotSelection(block, lotNumber) && !isExistingLotUnchanged(currentResident, lot)) {
      throw new Error(`${formatLotLabel(block, lotNumber)} is not part of the allowed Sitio Hiyas lot list.`);
    }
  }

  if (!lots.length) {
    return;
  }

  const conflicts = await Resident.find({
    ...(currentResident ? { _id: { $ne: currentResident._id } } : {}),
    $or: lots.map((lot) => ({
      lots: {
        $elemMatch: {
          block: String(lot.block),
          lotNumber: String(lot.lotNumber),
        },
      },
    })),
  }).select('residentCode firstName middleName lastName lots');

  if (!conflicts.length) {
    return;
  }

  for (const conflictResident of conflicts) {
    for (const lot of lots) {
      const match = conflictResident.lots.find(
        (residentLot) =>
          String(residentLot.block) === String(lot.block) &&
          String(residentLot.lotNumber) === String(lot.lotNumber)
      );

      if (match) {
        throw new Error(
          `${formatLotLabel(lot.block, lot.lotNumber)} is already assigned to ` +
            `${getResidentName(conflictResident)} (${conflictResident.residentCode}).`
        );
      }
    }
  }
}

async function ensureUniqueResidentCode(preferredCode) {
  let candidate = preferredCode || generateResidentCode();

  while (await Resident.exists({ residentCode: candidate })) {
    candidate = generateResidentCode();
  }

  return candidate;
}

async function recalculateLotBalance(residentId, lotId) {
  const resident = await Resident.findById(residentId);

  if (!resident) {
    return null;
  }

  const lot = resident.lots.id(lotId);

  if (!lot) {
    return null;
  }

  const paymentTotals = await Payment.aggregate([
    {
      $match: {
        resident: resident._id,
        lotId: lotId.toString(),
      },
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$amount' },
      },
    },
  ]);

  const totalPaid = paymentTotals[0]?.totalPaid || 0;
  lot.remainingBalance = Math.max(lot.totalBalance - totalPaid, 0);
  await resident.save();

  return toResidentSummary(resident);
}

async function ensureDatabaseSeeded() {
  const legacyResidents = await Resident.collection
    .find({
      $or: [
        { residentCode: { $exists: false } },
        { lots: { $exists: false } },
      ],
    })
    .toArray();

  for (const legacy of legacyResidents) {
    const nameParts = String(legacy.fullName || 'Resident Record').trim().split(/\s+/);
    const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Resident';
    const rawLot = String(legacy.lotNumber || '').trim();
    const [block, lotNumber] = rawLot.includes('-') ? rawLot.split('-') : ['N/A', rawLot || 'N/A'];

    await Resident.collection.updateOne(
      { _id: legacy._id },
      {
        $set: {
          residentCode: await ensureUniqueResidentCode(),
          firstName,
          middleName: '',
          lastName,
          contactNumber: sanitizeContactNumber(legacy.contactNumber),
          address: legacy.address || 'Address not yet provided',
          isActive: true,
          lots: [
            {
              block,
              lotNumber,
              squareMeters: DEFAULT_SQUARE_METERS,
              pricePerSquareMeter: derivePricePerSquareMeter({
                totalBalance: normalizeCurrency(legacy.balance),
                squareMeters: DEFAULT_SQUARE_METERS,
                isSpotCash: false,
                interestYears: DEFAULT_INTEREST_YEARS,
              }),
              isSpotCash: false,
              interestYears: DEFAULT_INTEREST_YEARS,
              totalBalance: normalizeCurrency(legacy.balance),
              remainingBalance: normalizeCurrency(legacy.balance),
              isActive: true,
            },
          ],
        },
        $unset: {
          fullName: '',
          lotNumber: '',
          balance: '',
          email: '',
        },
      }
    );
  }

  const residentsWithLegacyMiddleInitial = await Resident.collection
    .find({
      middleName: { $exists: false },
      middleInitial: { $exists: true },
    })
    .toArray();

  for (const resident of residentsWithLegacyMiddleInitial) {
    await Resident.collection.updateOne(
      { _id: resident._id },
      {
        $set: {
          middleName: sanitizeMiddleName(resident.middleInitial),
        },
        $unset: {
          middleInitial: '',
        },
      }
    );
  }

  for (const seedResident of seedResidents) {
    const existing = await Resident.findOne({ residentCode: seedResident.residentCode });

    if (!existing) {
      await Resident.create(seedResident);
    }
  }

  const seededResidents = seedResidents.length
    ? await Resident.find({
        residentCode: { $in: seedResidents.map((resident) => resident.residentCode) },
      })
    : [];

  for (const seedPayment of seedPayments) {
    const resident = seededResidents.find((item) => item.residentCode === seedPayment.residentCode);
    const lot = resident?.lots.find((item) => item.block === seedPayment.block && item.lotNumber === seedPayment.lotNumber);

    if (!resident || !lot) {
      continue;
    }

    const existingPayment = await Payment.findOne({
      resident: resident._id,
      lotId: lot._id.toString(),
      amount: seedPayment.amount,
      paymentDate: new Date(seedPayment.paymentDate),
    });

    if (!existingPayment) {
      await Payment.create({
        resident: resident._id,
        residentCode: resident.residentCode,
        residentName: getResidentName(resident),
        lotId: lot._id.toString(),
        block: lot.block,
        lotNumber: lot.lotNumber,
        squareMeters: lot.squareMeters,
        amount: seedPayment.amount,
        type: normalizePaymentType(seedPayment.type),
        method: normalizePaymentMethod(seedPayment.method),
        notes: seedPayment.notes,
        paymentDate: new Date(seedPayment.paymentDate),
      });
    }
  }

  const residents = await Resident.find();
  const payments = await Payment.find();

  for (const resident of residents) {
    let hasPricingUpdates = false;
    const matchingSeedResident = seedResidents.find((seedResident) => seedResident.residentCode === resident.residentCode);
    const nextContactNumber = sanitizeContactNumber(resident.contactNumber);

    if (resident.contactNumber !== nextContactNumber) {
      resident.contactNumber = nextContactNumber;
      hasPricingUpdates = true;
    }

    const nextMiddleName = sanitizeMiddleName(
      resident.middleName || resident.middleInitial || matchingSeedResident?.middleName || matchingSeedResident?.middleInitial
    );
    if (resident.middleName !== nextMiddleName) {
      resident.middleName = nextMiddleName;
      hasPricingUpdates = true;
    }

    for (const lot of resident.lots) {
      const nextSquareMeters = lot.squareMeters > 0 ? lot.squareMeters : DEFAULT_SQUARE_METERS;
      const nextIsSpotCash = lot.isSpotCash === true;
      const nextInterestYears = normalizeInterestYears(lot.interestYears);
      const nextPricePerSquareMeter =
        lot.pricePerSquareMeter > 0
          ? roundCurrency(lot.pricePerSquareMeter)
          : derivePricePerSquareMeter({
              totalBalance: lot.totalBalance,
              squareMeters: nextSquareMeters,
              isSpotCash: nextIsSpotCash,
              interestYears: nextInterestYears,
            });
      const derivedPricing = calculateLotPricing({
        squareMeters: nextSquareMeters,
        pricePerSquareMeter: nextPricePerSquareMeter,
        isSpotCash: nextIsSpotCash,
        interestYears: nextInterestYears,
      });

      if (lot.squareMeters !== nextSquareMeters) {
        lot.squareMeters = nextSquareMeters;
        hasPricingUpdates = true;
      }

      if (lot.pricePerSquareMeter !== nextPricePerSquareMeter) {
        lot.pricePerSquareMeter = nextPricePerSquareMeter;
        hasPricingUpdates = true;
      }

      if (lot.isSpotCash !== nextIsSpotCash) {
        lot.isSpotCash = nextIsSpotCash;
        hasPricingUpdates = true;
      }

      if (normalizeInterestYears(lot.interestYears) !== nextInterestYears) {
        lot.interestYears = nextInterestYears;
        hasPricingUpdates = true;
      }

      if (!(lot.totalBalance > 0) && derivedPricing.totalBalance > 0) {
        lot.totalBalance = derivedPricing.totalBalance;
        hasPricingUpdates = true;
      }

      if (!(lot.remainingBalance >= 0)) {
        lot.remainingBalance = lot.totalBalance;
        hasPricingUpdates = true;
      }
    }

    if (hasPricingUpdates) {
      await resident.save();
    }
  }

  for (const resident of residents) {
    for (const lot of resident.lots) {
      await Payment.updateMany(
        {
          resident: resident._id,
          lotId: lot._id.toString(),
        },
        {
          $set: {
            residentName: getResidentName(resident),
            residentCode: resident.residentCode,
            block: lot.block,
            lotNumber: lot.lotNumber,
            squareMeters: lot.squareMeters,
          },
        }
      );

      await recalculateLotBalance(resident._id, lot._id);
    }
  }

  for (const payment of payments) {
    const nextType = normalizePaymentType(payment.type);
    const nextMethod = normalizePaymentMethod(payment.method);

    if (payment.type !== nextType || payment.method !== nextMethod) {
      payment.type = nextType;
      payment.method = nextMethod;
      await payment.save();
    }
  }
}

async function getDashboardSummary() {
  const residents = await Resident.find().sort({ lastName: 1, firstName: 1 });
  const payments = await Payment.find().sort({ paymentDate: -1 }).limit(8);
  const allLots = residents.flatMap((resident) => resident.lots.map((lot) => ({ resident, lot })));

  const totalResidents = residents.length;
  const activeLots = allLots.filter(({ lot }) => lot.isActive).length;
  const totalBalance = allLots.reduce((sum, { lot }) => sum + lot.totalBalance, 0);
  const totalOutstanding = allLots.reduce((sum, { lot }) => sum + lot.remainingBalance, 0);
  const totalCollected = totalBalance - totalOutstanding;
  const collectionRate = totalBalance > 0 ? Math.round((totalCollected / totalBalance) * 100) : 0;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyPayments = await Payment.aggregate([
    {
      $match: {
        paymentDate: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
        },
        amount: { $sum: '$amount' },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
      },
    },
  ]);

  const monthlyCollections = monthlyPayments.map((entry) => ({
    label: new Date(entry._id.year, entry._id.month - 1, 1).toLocaleString('en-US', {
      month: 'short',
    }),
    amount: entry.amount,
  }));

  return {
    stats: {
      totalResidents,
      activeLots,
      totalBalance,
      totalOutstanding,
      totalCollected,
      collectionRate,
    },
    monthlyCollections,
    recentPayments: payments.map(toPaymentSummary),
    overdueLots: allLots
      .filter(({ lot }) => lot.remainingBalance > 0)
      .sort((left, right) => right.lot.remainingBalance - left.lot.remainingBalance)
      .slice(0, 5)
      .map(({ resident, lot }) => ({
        residentId: resident._id.toString(),
        residentCode: resident.residentCode,
        residentName: getResidentName(resident),
        block: lot.block,
        lotNumber: lot.lotNumber,
        remainingBalance: lot.remainingBalance,
      })),
  };
}

async function getPublicOccupancySummary() {
  const residents = await Resident.find({ isActive: true }).select('lots');
  const occupiedLots = residents.flatMap((resident) => resident.lots.filter((lot) => lot.isActive !== false));
  const occupiedBlocksMap = new Map();

  occupiedLots.forEach((lot) => {
    const blockKey = String(lot.block);
    occupiedBlocksMap.set(blockKey, (occupiedBlocksMap.get(blockKey) || 0) + 1);
  });

  const occupiedBlocks = Array.from(occupiedBlocksMap.entries())
    .map(([block, occupiedLotsCount]) => ({
      block,
      occupiedLots: occupiedLotsCount,
    }))
    .sort((left, right) => Number(left.block) - Number(right.block));

  const occupiedResidents = residents.filter((resident) => resident.lots.some((lot) => lot.isActive !== false)).length;

  return {
    occupiedResidents,
    occupiedLots: occupiedLots.length,
    occupiedBlocksCount: occupiedBlocks.length,
    occupiedBlocks,
  };
}

async function getPublicBlockLotStatus() {
  const residents = await Resident.find({ isActive: true }).select('lastName profileImageUrl lots');
  const occupiedLotMap = new Map();

  residents.forEach((resident) => {
    resident.lots
      .filter((lot) => lot.isActive !== false)
      .forEach((lot) => {
        const lotKey = `${lot.block}:${lot.lotNumber}`;

        occupiedLotMap.set(lotKey, {
          residentLastName: resident.lastName,
          residentProfileImageUrl: resident.profileImageUrl || '',
          status: isLotFullyPaid(lot) ? 'fully-paid' : 'occupied',
        });
      });
  });

  const blocks = Object.entries(LOT_CATALOG)
    .sort(([leftBlock], [rightBlock]) => Number(leftBlock) - Number(rightBlock))
    .map(([block, lotNumbers]) => ({
      block,
      lots: lotNumbers.map((lotNumber) => {
        const assignedLot = occupiedLotMap.get(`${block}:${lotNumber}`);

        return {
          lotNumber,
          residentLastName: assignedLot?.residentLastName || '',
          residentProfileImageUrl: assignedLot?.residentProfileImageUrl || '',
          status: assignedLot?.status || 'available',
        };
      }),
    }));

  const totals = blocks.reduce(
    (summary, block) => {
      block.lots.forEach((lot) => {
        if (lot.status === 'available') {
          summary.available += 1;
        } else if (lot.status === 'occupied') {
          summary.occupied += 1;
        } else if (lot.status === 'fully-paid') {
          summary.fullyPaid += 1;
        }
      });

      return summary;
    },
    { available: 0, occupied: 0, fullyPaid: 0 }
  );

  return {
    blocks,
    totals,
  };
}

async function listResidents() {
  const residents = await Resident.find().sort({ lastName: 1, firstName: 1 });
  return residents.map(toResidentSummary);
}

async function createResident(payload, options = {}) {
  const normalized = normalizeResidentInput(payload);

  if (!normalized.firstName || !normalized.lastName || !normalized.address) {
    throw new Error('Resident first name, last name, and address are required.');
  }

  assertLotFinancialsValid(normalized.lots);
  await assertLotAssignmentsValid(normalized.lots);

  normalized.residentCode = await ensureUniqueResidentCode(normalized.residentCode);
  normalized.lots = normalized.lots.map((lot) => ({
    ...lot,
    remainingBalance: lot.totalBalance,
  }));

  const uploadedProfileImage = await uploadResidentProfileImage(options.profileImageFile);
  if (uploadedProfileImage) {
    normalized.profileImageUrl = uploadedProfileImage.url;
    normalized.profileImagePublicId = uploadedProfileImage.publicId;
  }

  const resident = await Resident.create(normalized);
  await syncResidentChatThread(resident);
  return toResidentSummary(resident);
}

async function updateResident(residentId, payload, options = {}) {
  const resident = await Resident.findById(residentId);

  if (!resident) {
    throw new Error('Resident not found.');
  }

  const normalized = normalizeResidentInput(payload);

  if (!normalized.firstName || !normalized.lastName || !normalized.address) {
    throw new Error('Resident first name, last name, and address are required.');
  }

  const lockedLotConflict = findLockedLotConflict(resident, normalized.lots);
  if (lockedLotConflict) {
    throw new Error(lockedLotConflict);
  }

  assertLotFinancialsValid(normalized.lots);
  await assertLotAssignmentsValid(normalized.lots, resident);

  resident.firstName = normalized.firstName;
  resident.middleName = normalized.middleName;
  resident.lastName = normalized.lastName;
  resident.contactNumber = normalized.contactNumber;
  resident.address = normalized.address;
  resident.isActive = normalized.isActive;

  const previousProfileImagePublicId = resident.profileImagePublicId;
  const uploadedProfileImage = await uploadResidentProfileImage(options.profileImageFile);
  if (uploadedProfileImage) {
    resident.profileImageUrl = uploadedProfileImage.url;
    resident.profileImagePublicId = uploadedProfileImage.publicId;
  }

  const previousLotIds = new Set(resident.lots.map((lot) => lot._id.toString()));

  resident.lots = normalized.lots.map((lot) => {
    const existingLot = lot._id ? resident.lots.id(lot._id) : null;

    if (existingLot && isLotFullyPaid(existingLot)) {
      return {
        _id: existingLot._id,
        block: existingLot.block,
        lotNumber: existingLot.lotNumber,
        squareMeters: existingLot.squareMeters,
        pricePerSquareMeter: existingLot.pricePerSquareMeter,
        isSpotCash: existingLot.isSpotCash,
        interestYears: normalizeInterestYears(existingLot.interestYears),
        totalBalance: existingLot.totalBalance,
        remainingBalance: existingLot.remainingBalance,
        isActive: existingLot.isActive,
      };
    }

    return {
      _id: lot._id || undefined,
      block: lot.block,
      lotNumber: lot.lotNumber,
      squareMeters: lot.squareMeters,
      pricePerSquareMeter: lot.pricePerSquareMeter,
      isSpotCash: lot.isSpotCash,
      interestYears: normalizeInterestYears(lot.interestYears),
      totalBalance: lot.totalBalance,
      remainingBalance: lot.totalBalance,
      isActive: lot.isActive,
    };
  });

  const nextLotIds = new Set(resident.lots.map((lot) => lot._id.toString()));
  const removedLotIds = Array.from(previousLotIds).filter((lotId) => !nextLotIds.has(lotId));

  await resident.save();

  if (uploadedProfileImage && previousProfileImagePublicId && previousProfileImagePublicId !== uploadedProfileImage.publicId) {
    await deleteImage(previousProfileImagePublicId);
  }

  await syncResidentChatThread(resident);

  await Promise.all(
    resident.lots.map((lot) =>
      Payment.updateMany(
        {
          resident: resident._id,
          lotId: lot._id.toString(),
        },
        {
          $set: {
            residentName: getResidentName(resident),
            residentCode: resident.residentCode,
            block: lot.block,
            lotNumber: lot.lotNumber,
            squareMeters: lot.squareMeters,
          },
        }
      )
    )
  );

  if (removedLotIds.length) {
    const removedPayments = await Payment.find({
      resident: resident._id,
      lotId: { $in: removedLotIds },
    }).select('receiptImagePublicId');

    await deletePaymentReceiptAssets(removedPayments);
    await Payment.deleteMany({
      resident: resident._id,
      lotId: { $in: removedLotIds },
    });
  }

  for (const lot of resident.lots) {
    await recalculateLotBalance(resident._id, lot._id);
  }

  const updated = await Resident.findById(resident._id);
  return toResidentSummary(updated);
}

async function transferResidentLot(residentId, payload) {
  const sourceResident = await Resident.findById(residentId);

  if (!sourceResident) {
    throw new Error('Resident not found.');
  }

  const lot = sourceResident.lots.id(payload.lotId);

  if (!lot) {
    throw new Error('Selected lot was not found.');
  }

  if (isLotFullyPaid(lot)) {
    throw new Error(`Fully paid ${formatLotLabel(lot.block, lot.lotNumber)} is locked and cannot be transferred.`);
  }

  const nextResident = await Resident.create({
    residentCode: await ensureUniqueResidentCode(),
    firstName: trimValue(payload.firstName),
    middleName: sanitizeMiddleName(payload.middleName || payload.middleInitial),
    lastName: trimValue(payload.lastName),
    contactNumber: sanitizeContactNumber(payload.contactNumber),
    address: trimValue(payload.address),
    isActive: true,
    lots: [
      {
        block: lot.block,
        lotNumber: lot.lotNumber,
        squareMeters: lot.squareMeters,
        pricePerSquareMeter: lot.pricePerSquareMeter,
        isSpotCash: lot.isSpotCash,
        interestYears: normalizeInterestYears(lot.interestYears),
        totalBalance: lot.totalBalance,
        remainingBalance: lot.remainingBalance,
        isActive: true,
      },
    ],
  });

  const migratedLot = nextResident.lots[0];

  await Payment.updateMany(
    {
      resident: sourceResident._id,
      lotId: lot._id.toString(),
    },
    {
      $set: {
        resident: nextResident._id,
        residentCode: nextResident.residentCode,
        residentName: getResidentName(nextResident),
        lotId: migratedLot._id.toString(),
      },
    }
  );

  sourceResident.lots.pull({ _id: lot._id });
  sourceResident.isActive = sourceResident.lots.length > 0;

  if (sourceResident.lots.length === 0) {
    await deleteImage(sourceResident.profileImagePublicId);
    await sourceResident.deleteOne();
  } else {
    await sourceResident.save();
  }

  await recalculateLotBalance(nextResident._id, migratedLot._id);
  await syncResidentChatThread(nextResident);

  if (sourceResident.lots.length === 0) {
    await deleteResidentChatThread(sourceResident._id);
  } else {
    await syncResidentChatThread(sourceResident);
  }

  return toResidentSummary(nextResident);
}

async function deleteResident(residentId) {
  const resident = await Resident.findById(residentId);

  if (!resident) {
    throw new Error('Resident not found.');
  }

  const lockedLot = resident.lots.find((lot) => isLotFullyPaid(lot));

  if (lockedLot) {
    throw new Error(`Fully paid ${formatLotLabel(lockedLot.block, lockedLot.lotNumber)} is locked and cannot be forfeited.`);
  }

  const payments = await Payment.find({ resident: resident._id }).select('receiptImagePublicId');
  await deletePaymentReceiptAssets(payments);
  await Payment.deleteMany({ resident: resident._id });
  await deleteImage(resident.profileImagePublicId);
  await resident.deleteOne();
  await deleteResidentChatThread(resident._id);
}

async function listPaymentLots() {
  const residents = await Resident.find().sort({ lastName: 1, firstName: 1 });

  return residents.flatMap((resident) =>
    resident.lots
      .filter((lot) => lot.isActive)
      .map((lot) => ({
        residentId: resident._id.toString(),
        residentCode: resident.residentCode,
        residentName: getResidentName(resident),
        profileImageUrl: resident.profileImageUrl || '',
        contactNumber: sanitizeContactNumber(resident.contactNumber),
        address: resident.address,
        block: lot.block,
        lotNumber: lot.lotNumber,
        squareMeters: lot.squareMeters,
        pricePerSquareMeter: lot.pricePerSquareMeter || 0,
        isSpotCash: lot.isSpotCash === true,
        interestYears: normalizeInterestYears(lot.interestYears),
        remainingBalance: lot.remainingBalance,
        totalBalance: lot.totalBalance,
        lotId: lot._id.toString(),
      }))
  );
}

async function getPaymentLotDetails(residentId, lotId) {
  const resident = await Resident.findById(residentId);

  if (!resident) {
    throw new Error('Resident not found.');
  }

  const lot = resident.lots.id(lotId);

  if (!lot) {
    throw new Error('Lot not found.');
  }

  const history = await Payment.find({
    resident: resident._id,
    lotId: lot._id.toString(),
  }).sort({ paymentDate: -1, createdAt: -1 });

  return {
    residentId: resident._id.toString(),
    residentCode: resident.residentCode,
    residentName: getResidentName(resident),
    firstName: resident.firstName,
    middleName: sanitizeMiddleName(resident.middleName || resident.middleInitial),
    lastName: resident.lastName,
    contactNumber: sanitizeContactNumber(resident.contactNumber),
    address: resident.address,
    profileImageUrl: resident.profileImageUrl || '',
    lot: toPlainLot(lot),
    paymentHistory: history.map(toPaymentSummary),
  };
}

async function createPayment(payload, options = {}) {
  const resident = await Resident.findById(payload.residentId);

  if (!resident) {
    throw new Error('Resident not found.');
  }

  const lot = resident.lots.id(payload.lotId);

  if (!lot) {
    throw new Error('Lot not found.');
  }

  assertPaymentAmountValid(payload.amount);
  const uploadedReceiptImage = await uploadPaymentReceiptImage(options.receiptImageFile);
  const payment = await Payment.create({
    resident: resident._id,
    residentCode: resident.residentCode,
    residentName: getResidentName(resident),
    lotId: lot._id.toString(),
    block: lot.block,
    lotNumber: lot.lotNumber,
    squareMeters: lot.squareMeters,
    amount: normalizeCurrency(payload.amount),
    type: normalizePaymentType(payload.type),
    method: normalizePaymentMethod(payload.method),
    receiptImageUrl: uploadedReceiptImage?.url || '',
    receiptImagePublicId: uploadedReceiptImage?.publicId || '',
    notes: trimValue(payload.notes) || '',
    paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
  });

  await recalculateLotBalance(resident._id, lot._id);
  return toPaymentSummary(payment);
}

async function updatePayment(paymentId, payload, options = {}) {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error('Payment record not found.');
  }

  assertPaymentAmountValid(payload.amount);
  const previousReceiptImagePublicId = payment.receiptImagePublicId;
  const uploadedReceiptImage = await uploadPaymentReceiptImage(options.receiptImageFile);
  payment.amount = normalizeCurrency(payload.amount, payment.amount);
  payment.type = normalizePaymentType(payload.type || payment.type);
  payment.method = normalizePaymentMethod(payload.method || payment.method);
  if (uploadedReceiptImage) {
    payment.receiptImageUrl = uploadedReceiptImage.url;
    payment.receiptImagePublicId = uploadedReceiptImage.publicId;
  }
  payment.notes = trimValue(payload.notes) || '';
  payment.paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : payment.paymentDate;
  await payment.save();

  if (uploadedReceiptImage && previousReceiptImagePublicId && previousReceiptImagePublicId !== uploadedReceiptImage.publicId) {
    await deleteImage(previousReceiptImagePublicId);
  }

  await recalculateLotBalance(payment.resident, payment.lotId);
  return toPaymentSummary(payment);
}

async function deletePayment(paymentId) {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error('Payment record not found.');
  }

  const residentId = payment.resident;
  const lotId = payment.lotId;
  await deleteImage(payment.receiptImagePublicId);
  await payment.deleteOne();
  await recalculateLotBalance(residentId, lotId);
}

async function searchResidentInformation(query) {
  if (query.residentId) {
    const resident = await Resident.findOne({
      residentCode: trimValue(query.residentId).toUpperCase(),
    });

    if (!resident) {
      return null;
    }

    return buildPublicResidentPayload(resident, resident.lots.map((lot) => lot._id.toString()));
  }

  const firstName = trimValue(query.firstName);
  const lastName = trimValue(query.lastName);
  const block = trimValue(query.block);
  const lotNumber = trimValue(query.lotNumber);

  if (!firstName || !lastName || !block || !lotNumber) {
    throw new Error('First name, last name, block, and lot number are required.');
  }

  const resident = await Resident.findOne({
    firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') },
    lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, 'i') },
    lots: {
      $elemMatch: {
        block: { $regex: new RegExp(`^${escapeRegex(block)}$`, 'i') },
        lotNumber: { $regex: new RegExp(`^${escapeRegex(lotNumber)}$`, 'i') },
      },
    },
  });

  if (!resident) {
    return null;
  }

  const matchingLotIds = resident.lots
    .filter(
      (lot) =>
        lot.block.toLowerCase() === block.toLowerCase() &&
        lot.lotNumber.toLowerCase() === lotNumber.toLowerCase()
    )
    .map((lot) => lot._id.toString());

  return buildPublicResidentPayload(resident, matchingLotIds);
}

async function buildPublicResidentPayload(resident, visibleLotIds) {
  const lots = resident.lots.filter((lot) => visibleLotIds.includes(lot._id.toString()));
  const history = await Payment.find({
    resident: resident._id,
    lotId: { $in: lots.map((lot) => lot._id.toString()) },
  }).sort({ paymentDate: -1, createdAt: -1 });

  return {
    id: resident._id.toString(),
    residentCode: resident.residentCode,
    firstName: resident.firstName,
    middleName: sanitizeMiddleName(resident.middleName || resident.middleInitial),
    lastName: resident.lastName,
    fullName: getResidentFullName(resident),
    contactNumber: sanitizeContactNumber(resident.contactNumber),
    address: resident.address,
    profileImageUrl: resident.profileImageUrl || '',
    lots: lots.map((lot) => ({
      ...toPlainLot(lot),
      paymentHistory: history
        .filter((payment) => payment.lotId === lot._id.toString())
        .map(toPaymentSummary),
    })),
  };
}

module.exports = {
  ensureDatabaseSeeded,
  getDashboardSummary,
  getPublicBlockLotStatus,
  getPublicOccupancySummary,
  listResidents,
  createResident,
  updateResident,
  transferResidentLot,
  deleteResident,
  listPaymentLots,
  getPaymentLotDetails,
  createPayment,
  updatePayment,
  deletePayment,
  searchResidentInformation,
};
