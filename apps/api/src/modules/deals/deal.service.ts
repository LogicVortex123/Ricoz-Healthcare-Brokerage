import type { HydratedDocument } from 'mongoose';
import { HttpError } from '../../utils/errors';
import { recordAudit } from '../audit/audit.service';
import { Inquiry } from '../inquiries/inquiry.model';
import { asObjectId, Practice } from '../practices/practice.model';
import type { IUser } from '../users/user.model';
import { User } from '../users/user.model';
import {
  Assignment,
  ClosingTask,
  Commission,
  COMMISSION_NOTICE,
  Nda,
  NDA_STATEMENT,
  NDA_VERSION,
  Offer,
  RoomNote,
  SavedPractice,
  ThreadMessage,
  WORKSHEET_DISCLAIMER,
  WORKSHEET_FORMULA,
  Worksheet,
} from './deal.models';

type Actor = HydratedDocument<IUser>;

function idOf(value: unknown) {
  if (value && typeof value === 'object' && '_id' in value) return String((value as { _id: unknown })._id);
  return String(value ?? '');
}

async function practiceOr404(practiceId: string) {
  const oid = asObjectId(practiceId);
  if (!oid) throw new HttpError(404, 'That practice could not be found.', 'NOT_FOUND');
  const practice = await Practice.findById(oid);
  if (!practice) throw new HttpError(404, 'That practice could not be found.', 'NOT_FOUND');
  return practice;
}

async function assignmentFor(practiceId: unknown, brokerId: unknown) {
  return Assignment.findOne({ practiceId, brokerId });
}

export async function roomAccess(actor: Actor, practiceId: string) {
  const practice = await practiceOr404(practiceId);
  const owner = idOf(practice.ownerId) === idOf(actor._id);
  if (actor.role === 'ADMIN' || (actor.role === 'SELLER' && owner)) return { practice, level: 'full' as const };
  if (actor.role === 'SELLER') {
    if (practice.status !== 'APPROVED') throw new HttpError(404, 'That practice could not be found.', 'NOT_FOUND');
    return { practice, level: 'none' as const };
  }
  if (actor.role === 'BROKER') {
    const assignment = await assignmentFor(practice._id, actor._id);
    if (!assignment) {
      if (practice.status !== 'APPROVED') throw new HttpError(404, 'That practice could not be found.', 'NOT_FOUND');
      return { practice, level: 'none' as const };
    }
    return { practice, level: 'full' as const };
  }
  if (actor.role === 'BUYER') {
    if (practice.status !== 'APPROVED') throw new HttpError(404, 'That practice could not be found.', 'NOT_FOUND');
    const nda = await Nda.findOne({ practiceId: practice._id, buyerId: actor._id });
    return { practice, level: nda ? ('full' as const) : ('nda' as const) };
  }
  throw new HttpError(403, 'You do not have access to this action.', 'FORBIDDEN');
}

function presentWorksheet(sheet: { revenue: number; operatingExpenses: number; ownerAddBack: number; multipleLow: number; multipleHigh: number }) {
  const earnings = sheet.revenue - sheet.operatingExpenses + sheet.ownerAddBack;
  return {
    revenue: sheet.revenue,
    operatingExpenses: sheet.operatingExpenses,
    ownerAddBack: sheet.ownerAddBack,
    earnings,
    multipleLow: sheet.multipleLow,
    multipleHigh: sheet.multipleHigh,
    rangeLow: Math.round(earnings * sheet.multipleLow),
    rangeHigh: Math.round(earnings * sheet.multipleHigh),
    formula: WORKSHEET_FORMULA,
    disclaimer: WORKSHEET_DISCLAIMER,
  };
}

export async function practiceBundle(actor: Actor, practiceId: string) {
  const access = await roomAccess(actor, practiceId);
  const saved =
    actor.role === 'BUYER' ? Boolean(await SavedPractice.exists({ practiceId: access.practice._id, buyerId: actor._id })) : false;
  if (access.level === 'none') return { access: 'none' as const, saved: false, statement: NDA_STATEMENT };
  if (access.level === 'nda') {
    return { access: 'nda_required' as const, statement: NDA_STATEMENT, saved };
  }
  const [notes, worksheet, tasks, assignment, commission] = await Promise.all([
    RoomNote.find({ practiceId: access.practice._id }).sort({ createdAt: -1 }).limit(40),
    Worksheet.findOne({ practiceId: access.practice._id }),
    ClosingTask.find({ practiceId: access.practice._id }).sort({ createdAt: 1 }),
    Assignment.findOne({ practiceId: access.practice._id }).populate('brokerId', 'name email'),
    actor.role === 'BUYER' ? null : Commission.findOne({ practiceId: access.practice._id }).sort({ createdAt: -1 }),
  ]);
  const broker = assignment?.brokerId && typeof assignment.brokerId === 'object' && 'name' in assignment.brokerId
    ? { id: idOf(assignment.brokerId), name: String((assignment.brokerId as { name?: string }).name ?? '') }
    : null;
  return {
    access: 'open' as const,
    saved,
    statement: NDA_STATEMENT,
    notes: notes.map((note) => ({
      id: String(note._id),
      title: note.title,
      kind: note.kind,
      body: note.body,
      createdAt: note.createdAt,
    })),
    worksheet: worksheet ? presentWorksheet(worksheet) : null,
    tasks: tasks.map((task) => ({ id: String(task._id), label: task.label, done: task.done })),
    broker,
    commission: commission
      ? { id: String(commission._id), amount: commission.amount, note: commission.note, chargesCard: false, notice: COMMISSION_NOTICE }
      : null,
  };
}

export async function acceptNda(actor: Actor, practiceId: string) {
  if (actor.role !== 'BUYER') throw new HttpError(403, 'A buyer account accepts the confidentiality acknowledgement.', 'FORBIDDEN');
  const practice = await practiceOr404(practiceId);
  if (practice.status !== 'APPROVED') throw new HttpError(404, 'That practice could not be found.', 'NOT_FOUND');
  await Nda.updateOne(
    { practiceId: practice._id, buyerId: actor._id },
    { $setOnInsert: { practiceId: practice._id, buyerId: actor._id, statementVersion: NDA_VERSION } },
    { upsert: true },
  );
  await recordAudit({ actorId: idOf(actor._id), action: 'NDA_ACKNOWLEDGED', entityType: 'practice', entityId: idOf(practice._id) });
  return practiceBundle(actor, practiceId);
}

export async function addNote(actor: Actor, practiceId: string, input: { title: string; kind: string; body: string }) {
  const access = await roomAccess(actor, practiceId);
  const owner = actor.role === 'SELLER' && idOf(access.practice.ownerId) === idOf(actor._id);
  if (!owner && actor.role !== 'ADMIN') throw new HttpError(403, 'The practice owner adds confidential notes.', 'FORBIDDEN');
  const note = await RoomNote.create({ practiceId: access.practice._id, authorId: actor._id, ...input });
  return { id: String(note._id), title: note.title, kind: note.kind, body: note.body, createdAt: note.createdAt };
}

export async function saveWorksheet(
  actor: Actor,
  practiceId: string,
  input: { revenue: number; operatingExpenses: number; ownerAddBack: number; multipleLow: number; multipleHigh: number },
) {
  const access = await roomAccess(actor, practiceId);
  const owner = actor.role === 'SELLER' && idOf(access.practice.ownerId) === idOf(actor._id);
  if (!owner) throw new HttpError(403, 'The practice owner keeps this worksheet.', 'FORBIDDEN');
  if (input.multipleLow > input.multipleHigh) {
    throw new HttpError(400, 'The low multiple cannot be above the high multiple.', 'VALIDATION_ERROR');
  }
  const sheet = await Worksheet.findOneAndUpdate({ practiceId: access.practice._id }, input, { upsert: true, new: true, setDefaultsOnInsert: true });
  return presentWorksheet(sheet!);
}

export async function addTask(actor: Actor, practiceId: string, label: string) {
  const access = await roomAccess(actor, practiceId);
  if (access.level !== 'full' || actor.role === 'BUYER') throw new HttpError(403, 'You do not have access to this action.', 'FORBIDDEN');
  const task = await ClosingTask.create({ practiceId: access.practice._id, label });
  return { id: String(task._id), label: task.label, done: task.done };
}

export async function toggleTask(actor: Actor, taskId: string, done: boolean) {
  const oid = asObjectId(taskId);
  if (!oid) throw new HttpError(404, 'That task could not be found.', 'NOT_FOUND');
  const task = await ClosingTask.findById(oid);
  if (!task) throw new HttpError(404, 'That task could not be found.', 'NOT_FOUND');
  await roomAccess(actor, idOf(task.practiceId));
  if (actor.role === 'BUYER') throw new HttpError(403, 'You do not have access to this action.', 'FORBIDDEN');
  task.done = done;
  await task.save();
  return { id: String(task._id), label: task.label, done: task.done };
}

export async function setSaved(actor: Actor, practiceId: string, saved: boolean) {
  if (actor.role !== 'BUYER') throw new HttpError(403, 'Buyers can save practices.', 'FORBIDDEN');
  const practice = await practiceOr404(practiceId);
  if (practice.status !== 'APPROVED') throw new HttpError(404, 'That practice could not be found.', 'NOT_FOUND');
  if (saved) {
    await SavedPractice.updateOne({ practiceId: practice._id, buyerId: actor._id }, { $setOnInsert: { practiceId: practice._id, buyerId: actor._id } }, { upsert: true });
  } else {
    await SavedPractice.deleteOne({ practiceId: practice._id, buyerId: actor._id });
  }
  return { saved };
}

export async function listSaved(actor: Actor) {
  if (actor.role !== 'BUYER') throw new HttpError(403, 'Buyers can save practices.', 'FORBIDDEN');
  const rows = await SavedPractice.find({ buyerId: actor._id }).sort({ createdAt: -1 }).limit(50).populate('practiceId', 'name category city state askingPrice priceVisibility status');
  return rows.flatMap((row) => {
    const practice = row.practiceId;
    if (!practice || typeof practice !== 'object' || !('name' in practice)) return [];
    const item = practice as { _id: unknown; name?: string; category?: string; city?: string; state?: string; askingPrice?: number | null; priceVisibility?: string; status?: string };
    if (item.status !== 'APPROVED') return [];
    return [{
      id: idOf(item._id),
      name: item.name ?? '',
      category: item.category ?? '',
      city: item.city ?? '',
      state: item.state ?? '',
      askingPrice: item.askingPrice ?? null,
      priceVisibility: item.priceVisibility ?? 'ON_REQUEST',
    }];
  });
}

export async function assignBroker(actor: Actor, practiceId: string, brokerId: string) {
  if (actor.role !== 'ADMIN') throw new HttpError(403, 'An administrator assigns the broker.', 'FORBIDDEN');
  const practice = await practiceOr404(practiceId);
  const brokerOid = asObjectId(brokerId);
  if (!brokerOid) throw new HttpError(400, 'Choose a broker.', 'VALIDATION_ERROR');
  const broker = await User.findOne({ _id: brokerOid, role: 'BROKER' });
  if (!broker) throw new HttpError(400, 'That account is not a broker.', 'VALIDATION_ERROR');
  await Assignment.findOneAndUpdate(
    { practiceId: practice._id },
    { brokerId: broker._id, assignedBy: actor._id },
    { upsert: true, new: true },
  );
  await recordAudit({ actorId: idOf(actor._id), action: 'BROKER_ASSIGNED', entityType: 'practice', entityId: idOf(practice._id) });
  return { id: idOf(broker._id), name: broker.name };
}

export async function recordCommission(actor: Actor, practiceId: string, amount: number, note: string) {
  if (actor.role !== 'ADMIN') throw new HttpError(403, 'An administrator records the figure.', 'FORBIDDEN');
  const practice = await practiceOr404(practiceId);
  const entry = await Commission.create({ practiceId: practice._id, recordedBy: actor._id, amount, note });
  await recordAudit({ actorId: idOf(actor._id), action: 'COMMISSION_RECORDED', entityType: 'practice', entityId: idOf(practice._id) });
  return { id: String(entry._id), amount: entry.amount, note: entry.note, chargesCard: false as const, notice: COMMISSION_NOTICE };
}

async function inquiryForActor(actor: Actor, inquiryId: string) {
  const oid = asObjectId(inquiryId);
  if (!oid) throw new HttpError(404, 'That inquiry could not be found.', 'NOT_FOUND');
  const inquiry = await Inquiry.findById(oid);
  if (!inquiry) throw new HttpError(404, 'That inquiry could not be found.', 'NOT_FOUND');
  const mine = idOf(inquiry.buyerId) === idOf(actor._id) || idOf(inquiry.sellerId) === idOf(actor._id);
  if (actor.role === 'ADMIN' || mine) return inquiry;
  if (actor.role === 'BROKER' && (await assignmentFor(inquiry.practiceId, actor._id))) return inquiry;
  throw new HttpError(403, 'You do not have access to this action.', 'FORBIDDEN');
}

export async function inquiryThread(actor: Actor, inquiryId: string) {
  const inquiry = await inquiryForActor(actor, inquiryId);
  const [messages, offers] = await Promise.all([
    ThreadMessage.find({ inquiryId: inquiry._id }).sort({ createdAt: 1 }).limit(100).populate('authorId', 'name role'),
    Offer.find({ inquiryId: inquiry._id }).sort({ createdAt: 1 }).limit(40).populate('authorId', 'name role'),
  ]);
  const person = (value: unknown) => {
    if (!value || typeof value !== 'object' || !('name' in value)) return { name: 'Member', role: '' };
    const item = value as { name?: string; role?: string };
    return { name: item.name ?? 'Member', role: item.role ?? '' };
  };
  return {
    inquiryId: idOf(inquiry._id),
    practiceId: idOf(inquiry.practiceId),
    ownershipNotice: 'An accepted offer is a recorded proposal. It does not transfer ownership.',
    messages: messages.map((message) => ({ id: String(message._id), body: message.body, createdAt: message.createdAt, author: person(message.authorId) })),
    offers: offers.map((offer) => ({
      id: String(offer._id),
      amount: offer.amount,
      kind: offer.kind,
      note: offer.note,
      createdAt: offer.createdAt,
      author: person(offer.authorId),
    })),
  };
}

export async function addMessage(actor: Actor, inquiryId: string, body: string) {
  const inquiry = await inquiryForActor(actor, inquiryId);
  const message = await ThreadMessage.create({ inquiryId: inquiry._id, authorId: actor._id, body });
  return { id: String(message._id), body: message.body, createdAt: message.createdAt, author: { name: actor.name, role: actor.role } };
}

export async function addOffer(actor: Actor, inquiryId: string, input: { amount: number; kind: string; note: string }) {
  const inquiry = await inquiryForActor(actor, inquiryId);
  if (actor.role === 'ADMIN') throw new HttpError(403, 'The buyer, seller, or assigned broker records an offer.', 'FORBIDDEN');
  const offer = await Offer.create({ inquiryId: inquiry._id, authorId: actor._id, ...input });
  await recordAudit({ actorId: idOf(actor._id), action: 'OFFER_RECORDED', entityType: 'inquiry', entityId: idOf(inquiry._id) });
  return {
    id: String(offer._id),
    amount: offer.amount,
    kind: offer.kind,
    note: offer.note,
    createdAt: offer.createdAt,
    author: { name: actor.name, role: actor.role },
  };
}

export async function brokerDesk(actor: Actor) {
  if (actor.role !== 'BROKER') throw new HttpError(403, 'You do not have access to this action.', 'FORBIDDEN');
  const assignments = await Assignment.find({ brokerId: actor._id }).sort({ updatedAt: -1 }).limit(40).populate('practiceId', 'name category city state status');
  const rows = await Promise.all(
    assignments.map(async (assignment) => {
      const practice = assignment.practiceId;
      if (!practice || typeof practice !== 'object' || !('name' in practice)) return null;
      const item = practice as { _id: unknown; name?: string; category?: string; city?: string; state?: string; status?: string };
      const inquiries = await Inquiry.countDocuments({ practiceId: item._id, status: { $in: ['OPEN', 'ACKNOWLEDGED'] } });
      return {
        id: idOf(item._id),
        name: item.name ?? '',
        category: item.category ?? '',
        city: item.city ?? '',
        state: item.state ?? '',
        status: item.status ?? '',
        openInquiries: inquiries,
      };
    }),
  );
  return rows.filter((row) => row !== null);
}

export async function listBrokers() {
  const brokers = await User.find({ role: 'BROKER' }).select('name email').sort({ name: 1 }).limit(50);
  return brokers.map((broker) => ({ id: idOf(broker._id), name: broker.name, email: broker.email }));
}
