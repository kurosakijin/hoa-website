const Resident = require('../models/Resident');
const Payment = require('../models/Payment');
const { residents: seedResidents, payments: seedPayments } = require('../data/seedData');
const { generateResidentCode } = require('../utils/ids');

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeCurrency(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeLotInput(lot) {
  return {
    _id: lot.id || lot._id,
    block: trimValue(lot.block),
    lotNumber: trimValue(lot.lotNumber),
    squareMeters: normalizeCurrency(lot.squareMeters),
    totalBalance: normalizeCurrency(lot.totalBalance),
    remainingBalance: normalizeCurrency(
      lot.remainingBalance,
      normalizeCurrency(lot.totalBalance)
    ),
    isActive: lot.isActive !== false,
  };
}

function normalizeResidentInput(payload = {}) {
  return {
    residentCode: trimValue(payload.residentCode),
    firstName: trimValue(payload.firstName),
    lastName: trimValue(payload.lastName),
    contactNumber: trimValue(payload.contactNumber),
    address: trimValue(payload.address),
    status: payload.status === 'Tenant' ? 'Tenant' : 'Owner',
    isActive: payload.isActive !== false,
    lots: Array.isArray(payload.lots) ? payload.lots.map(normalizeLotInput).filter((lot) => lot.block && lot.lotNumber) : [],
  };
}

function getResidentName(resident) {
  return `${resident.lastName}, ${resident.firstName}`;
}

function toPlainLot(lot) {
  return {
    id: lot._id.toString(),
    block: lot.block,
    lotNumber: lot.lotNumber,
    squareMeters: lot.squareMeters,
    totalBalance: lot.totalBalance,
    remainingBalance: lot.remainingBalance,
    isActive: lot.isActive,
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
    lastName: resident.lastName,
    fullName: getResidentName(resident),
    contactNumber: resident.contactNumber,
    address: resident.address,
    status: resident.status,
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
    notes: payment.notes,
    paymentDate: payment.paymentDate.toISOString(),
    createdAt: payment.createdAt,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
          lastName,
          contactNumber: legacy.contactNumber || 'Not provided',
          address: legacy.address || 'Address not yet provided',
          status: legacy.status === 'Tenant' ? 'Tenant' : 'Owner',
          isActive: true,
          lots: [
            {
              block,
              lotNumber,
              squareMeters: 0,
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

  for (const seedResident of seedResidents) {
    const existing = await Resident.findOne({ residentCode: seedResident.residentCode });

    if (!existing) {
      await Resident.create(seedResident);
    }
  }

  const seededResidents = await Resident.find({
    residentCode: { $in: seedResidents.map((resident) => resident.residentCode) },
  });

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
        type: seedPayment.type,
        method: seedPayment.method,
        notes: seedPayment.notes,
        paymentDate: new Date(seedPayment.paymentDate),
      });
    }
  }

  const residents = await Resident.find();

  for (const resident of residents) {
    for (const lot of resident.lots) {
      await recalculateLotBalance(resident._id, lot._id);
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

async function listResidents() {
  const residents = await Resident.find().sort({ lastName: 1, firstName: 1 });
  return residents.map(toResidentSummary);
}

async function createResident(payload) {
  const normalized = normalizeResidentInput(payload);

  if (!normalized.firstName || !normalized.lastName || !normalized.contactNumber || !normalized.address) {
    throw new Error('Resident name, contact number, and address are required.');
  }

  if (!normalized.lots.length) {
    throw new Error('At least one lot must be assigned to the resident.');
  }

  normalized.residentCode = await ensureUniqueResidentCode(normalized.residentCode);
  normalized.lots = normalized.lots.map((lot) => ({
    ...lot,
    remainingBalance: Math.min(lot.remainingBalance, lot.totalBalance),
  }));

  const resident = await Resident.create(normalized);
  return toResidentSummary(resident);
}

async function updateResident(residentId, payload) {
  const resident = await Resident.findById(residentId);

  if (!resident) {
    throw new Error('Resident not found.');
  }

  const normalized = normalizeResidentInput(payload);

  if (!normalized.lots.length) {
    throw new Error('At least one lot must remain assigned to the resident.');
  }

  resident.firstName = normalized.firstName;
  resident.lastName = normalized.lastName;
  resident.contactNumber = normalized.contactNumber;
  resident.address = normalized.address;
  resident.status = normalized.status;
  resident.isActive = normalized.isActive;

  const previousLotIds = new Set(resident.lots.map((lot) => lot._id.toString()));

  resident.lots = normalized.lots.map((lot) => ({
    _id: lot._id,
    block: lot.block,
    lotNumber: lot.lotNumber,
    squareMeters: lot.squareMeters,
    totalBalance: lot.totalBalance,
    remainingBalance: Math.min(lot.remainingBalance, lot.totalBalance),
    isActive: lot.isActive,
  }));

  const nextLotIds = new Set(resident.lots.map((lot) => lot._id.toString()));
  const removedLotIds = Array.from(previousLotIds).filter((lotId) => !nextLotIds.has(lotId));

  await resident.save();

  if (removedLotIds.length) {
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

  const nextResident = await Resident.create({
    residentCode: await ensureUniqueResidentCode(),
    firstName: trimValue(payload.firstName),
    lastName: trimValue(payload.lastName),
    contactNumber: trimValue(payload.contactNumber),
    address: trimValue(payload.address),
    status: payload.status === 'Tenant' ? 'Tenant' : 'Owner',
    isActive: true,
    lots: [
      {
        block: lot.block,
        lotNumber: lot.lotNumber,
        squareMeters: lot.squareMeters,
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
    await sourceResident.deleteOne();
  } else {
    await sourceResident.save();
  }

  await recalculateLotBalance(nextResident._id, migratedLot._id);
  return toResidentSummary(nextResident);
}

async function deleteResident(residentId) {
  const resident = await Resident.findById(residentId);

  if (!resident) {
    throw new Error('Resident not found.');
  }

  await Payment.deleteMany({ resident: resident._id });
  await resident.deleteOne();
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
        contactNumber: resident.contactNumber,
        address: resident.address,
        block: lot.block,
        lotNumber: lot.lotNumber,
        squareMeters: lot.squareMeters,
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
    lastName: resident.lastName,
    contactNumber: resident.contactNumber,
    address: resident.address,
    lot: toPlainLot(lot),
    paymentHistory: history.map(toPaymentSummary),
  };
}

async function createPayment(payload) {
  const resident = await Resident.findById(payload.residentId);

  if (!resident) {
    throw new Error('Resident not found.');
  }

  const lot = resident.lots.id(payload.lotId);

  if (!lot) {
    throw new Error('Lot not found.');
  }

  const payment = await Payment.create({
    resident: resident._id,
    residentCode: resident.residentCode,
    residentName: getResidentName(resident),
    lotId: lot._id.toString(),
    block: lot.block,
    lotNumber: lot.lotNumber,
    squareMeters: lot.squareMeters,
    amount: normalizeCurrency(payload.amount),
    type: payload.type || 'Association Dues',
    method: payload.method,
    notes: trimValue(payload.notes) || '',
    paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
  });

  await recalculateLotBalance(resident._id, lot._id);
  return toPaymentSummary(payment);
}

async function updatePayment(paymentId, payload) {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error('Payment record not found.');
  }

  payment.amount = normalizeCurrency(payload.amount, payment.amount);
  payment.type = payload.type || payment.type;
  payment.method = payload.method || payment.method;
  payment.notes = trimValue(payload.notes) || '';
  payment.paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : payment.paymentDate;
  await payment.save();

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
    lastName: resident.lastName,
    fullName: `${resident.firstName} ${resident.lastName}`,
    contactNumber: resident.contactNumber,
    address: resident.address,
    status: resident.status,
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
