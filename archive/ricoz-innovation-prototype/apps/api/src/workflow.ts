import { Router, Request, Response, NextFunction } from 'express';
import mongoose, { Schema } from 'mongoose';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { z } from 'zod';

const userSchema = new Schema({ email: { type: String, unique: true }, name: String, password: String, role: String, qualification: { type: String, default: 'pending' } }, { timestamps: true });
const sessionSchema = new Schema({ token: { type: String, unique: true }, userId: String, expires: { type: Date, expires: 0 } });
const transitionSchema = new Schema({ ownerId: String, brokerId: String, participants: [String], title: String, confidentialName: String, sector: String, country: String, currency: String, region: String, type: String, ownershipPercent: Number, structure: String, representation: String, visibility: String, publication: { type: String, default: 'draft' }, stage: { type: String, default: 'onboarding' }, version: { type: Number, default: 0 }, nda: [Schema.Types.Mixed], grants: [Schema.Types.Mixed], requests: [String], documents: [Schema.Types.Mixed], offers: [Schema.Types.Mixed], tasks: [Schema.Types.Mixed], audit: [Schema.Types.Mixed] }, { timestamps: true });
export const User = mongoose.models.WorkflowUser || mongoose.model('WorkflowUser', userSchema);
const Session = mongoose.models.WorkflowSession || mongoose.model('WorkflowSession', sessionSchema);
export const Transition = mongoose.models.Transition || mongoose.model('Transition', transitionSchema);
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
export function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; }
export function checkPassword(password: string, stored: string) { const [salt, hash] = stored.split(':'); return !!salt && !!hash && timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64)); }
const safeUser = (u: any) => ({ id: String(u._id), email: u.email, name: u.name, role: u.role, qualification: u.qualification });
type AuthRequest = Request & { actor?: any };
const asyncRoute = (fn: (req: AuthRequest, res: Response) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);
function fail(status: number, message: string): never { throw Object.assign(new Error(message), { status }); }
function staff(u: any) { return u.role === 'broker' || u.role === 'admin'; }
function manager(u: any, t: any) { return u.role === 'admin' || (u.role === 'broker' && t.brokerId === String(u._id)); }
function member(u: any, t: any) { return manager(u, t) || t.ownerId === String(u._id) || t.participants.includes(String(u._id)); }
export function teaser(t: any) { return { id: String(t._id), title: t.title, sector: t.sector, country: t.country, region: t.region, currency: t.currency, type: t.type, ownershipPercent: t.ownershipPercent, structure: t.structure }; }
export function advance(stage: string, next: string, t: any) {
  const stages = ['onboarding', 'diligence', 'offer_accepted', 'legal_review', 'closing', 'closed', 'handover_complete'];
  if (stages.indexOf(next) !== stages.indexOf(stage) + 1) fail(422, 'Move one stage at a time');
  if (next === 'offer_accepted' && !t.offers.some((o: any) => o.status === 'accepted')) fail(422, 'An accepted offer is required');
  if (next === 'closing' && !t.documents.some((d: any) => d.category === 'agreement' && d.review === 'approved')) fail(422, 'A reviewed agreement is required');
  if (next === 'closed' && !t.documents.some((d: any) => d.category === 'closing_evidence' && d.review === 'approved')) fail(422, 'Reviewed closing evidence is required');
  if (next === 'handover_complete' && (!t.tasks.length || t.tasks.some((x: any) => !x.done))) fail(422, 'Complete the handover tasks');
  return next;
}
const router = Router();
const attempts = new Map<string, { count: number; until: number }>();
router.use((req, res, next) => { if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, error: { message: 'MongoDB unavailable; no data has been saved.' } }); next(); });
router.post('/auth/:action', asyncRoute(async (req, res) => {
  if (!['register', 'login'].includes(req.params.action)) fail(404, 'Unknown action');
  const key = req.ip || 'local'; const now = Date.now(); const a = attempts.get(key); if (a && a.until > now && a.count >= 15) fail(429, 'Too many attempts. Try again in 15 minutes.');
  if (attempts.size > 10000) for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  attempts.set(key, { count: a && a.until > now ? a.count + 1 : 1, until: a && a.until > now ? a.until : now + 900000 });
  const body = z.object({ email: z.string().email().transform(x => x.toLowerCase()), password: z.string().min(12).max(128), name: z.string().min(2).max(100).optional(), role: z.enum(['owner', 'buyer']).optional() }).parse(req.body);
  let u: any;
  if (req.params.action === 'register') { if (!body.name) fail(422, 'Name required'); u = await User.create({ ...body, role: body.role || 'owner', password: hashPassword(body.password) }); }
  else { u = await User.findOne({ email: body.email }); if (!u || !checkPassword(body.password, u.password)) fail(401, 'Invalid credentials'); }
  const token = randomBytes(32).toString('hex'); await Session.create({ token: digest(token), userId: u._id, expires: new Date(Date.now() + 8 * 3600000) });
  res.json({ success: true, data: { token, user: safeUser(u) } });
}));
router.get('/listings', asyncRoute(async (_req, res) => { const ts = await Transition.find({ visibility: 'public', publication: 'approved' }); res.json({ success: true, data: ts.map(teaser) }); }));
router.use((req: AuthRequest, _res, next) => { (async () => { const token = req.headers.authorization?.replace(/^Bearer /, ''); if (!token) fail(401, 'Sign in required'); const session = await Session.findOne({ token: digest(token), expires: { $gt: new Date() } }); if (!session) fail(401, 'Session expired'); req.actor = await User.findById(session.userId); if (!req.actor) fail(401, 'Session expired'); })().then(() => next()).catch(next); });
router.get('/me', asyncRoute(async (req, res) => { res.json({ success: true, data: safeUser(req.actor) }); }));
router.post('/logout', asyncRoute(async (req, res) => { await Session.deleteOne({ token: digest(req.headers.authorization!.replace(/^Bearer /, '')) }); res.json({ success: true }); }));
router.get('/users', asyncRoute(async (req, res) => { if (!staff(req.actor)) fail(403, 'Staff only'); res.json({ success: true, data: (await User.find()).map(safeUser) }); }));
router.post('/users/:id/qualification', asyncRoute(async (req, res) => { if (!staff(req.actor)) fail(403, 'Staff only'); const b = z.object({ qualification: z.enum(['approved', 'rejected']), reason: z.string().min(5) }).parse(req.body); const u = await User.findById(req.params.id); if (!u || u.role !== 'buyer') fail(404, 'Buyer not found'); u.qualification = b.qualification; await u.save(); res.json({ success: true, data: safeUser(u) }); }));
router.get('/transitions', asyncRoute(async (req, res) => { const u = req.actor; const filter = u.role === 'admin' ? {} : { $or: [{ ownerId: String(u._id) }, { brokerId: String(u._id) }, { participants: String(u._id) }] }; const ts = await Transition.find(filter).select('-documents.content'); res.json({ success: true, data: ts.map((t: any) => view(u, t.toObject())) }); }));
router.post('/transitions', asyncRoute(async (req, res) => {
  const u = req.actor; if (u.role === 'buyer') fail(403, 'Owners or staff create transitions');
  const b = z.object({ title: z.string().min(10).max(150), confidentialName: z.string().min(2).max(150), sector: z.enum(['dental', 'veterinary', 'specialist_medical']), country: z.string().length(2).transform(x => x.toUpperCase()), currency: z.string().length(3).transform(x => x.toUpperCase()), region: z.string().min(2).max(80), type: z.enum(['acquisition', 'partial_buyout', 'partner_retirement', 'succession']), ownershipPercent: z.number().positive().max(100), structure: z.enum(['assets', 'equity', 'undecided']), representation: z.enum(['seller', 'buyer', 'both', 'undecided']), visibility: z.enum(['private', 'public']) }).parse(req.body);
  const t = await Transition.create({ ...b, ownerId: String(u._id), brokerId: staff(u) ? String(u._id) : undefined, audit: [{ action: 'created', actor: String(u._id), at: new Date(), reason: 'Private intake' }] }); res.status(201).json({ success: true, data: t });
}));
function view(u: any, t: any) { const full = manager(u, t) || t.ownerId === String(u._id); if (full) return t; const granted = t.grants.some((g: any) => g.userId === String(u._id) && g.scope === 'identity' && new Date(g.expires) > new Date()); return { ...teaser(t), _id: t._id, version: t.version, stage: t.stage, confidentialName: granted ? t.confidentialName : undefined, documents: t.documents.filter((d: any) => allowed(u, t, d.id)).map(({ content, ...d }: any) => d), offers: t.offers.filter((o: any) => o.userId === String(u._id)), tasks: t.tasks, nda: t.nda.filter((n: any) => n.userId === String(u._id)) }; }
function allowed(u: any, t: any, documentId: string) { return manager(u, t) || t.ownerId === String(u._id) || t.grants.some((g: any) => g.userId === String(u._id) && g.scope === documentId && new Date(g.expires) > new Date()); }
router.get('/transitions/:id/documents/:documentId', asyncRoute(async (req, res) => { const t: any = await Transition.findById(req.params.id); if (!t || !member(req.actor, t) || !allowed(req.actor, t, req.params.documentId)) fail(404, 'Document not found'); const d = t.documents.find((x: any) => x.id === req.params.documentId); if (!d || (d.review !== 'approved' && !manager(req.actor, t) && t.ownerId !== String(req.actor._id))) fail(404, 'Document not found'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Disposition', `attachment; filename="${d.name.replace(/[^a-zA-Z0-9._-]/g, '_')}"`); res.type('application/octet-stream').send(Buffer.from(d.content, 'base64')); }));
router.post('/transitions/:id/actions/:action', asyncRoute(async (req, res) => {
  const u = req.actor; const uid = String(u._id); const t: any = await Transition.findById(req.params.id); if (!t) fail(404, 'Transition not found');
  const action = req.params.action; const b = req.body; const isManager = manager(u, t); const isOwner = t.ownerId === uid;
  if (action === 'request_access') { if (u.role !== 'buyer' || t.visibility !== 'public' || t.publication !== 'approved') fail(404, 'Listing not found'); if (!t.requests.includes(uid)) t.requests.push(uid); }
  else if (action === 'claim') { if (!staff(u) || t.brokerId) fail(403, 'Cannot claim transition'); t.brokerId = uid; }
  else {
    if (!member(u, t)) fail(404, 'Transition not found');
    if (action === 'publish') { if (!isManager || t.visibility !== 'public') fail(403, 'Assigned broker must approve public publication'); t.publication = z.enum(['approved', 'rejected']).parse(b.decision); }
    else if (action === 'invite') { if (!isManager) fail(403, 'Assigned broker only'); const target = await User.findOne({ email: z.string().email().parse(b.email).toLowerCase() }); if (!target) fail(422, 'Participant must register first'); if (!t.participants.includes(String(target._id))) t.participants.push(String(target._id)); }
    else if (action === 'nda') { if (!process.env.NDA_TEXT || !process.env.NDA_VERSION) fail(503, 'A reviewed NDA must be configured before acceptance'); const name = z.string().parse(b.name); if (name !== u.name) fail(422, 'Use your registered name'); t.nda = t.nda.filter((n: any) => n.userId !== uid); t.nda.push({ userId: uid, name, hash: digest(process.env.NDA_TEXT), version: process.env.NDA_VERSION, at: new Date(), ip: req.ip }); }
    else if (action === 'grant') { if (!isManager) fail(403, 'Assigned broker only'); const g = z.object({ userId: z.string(), scope: z.string(), expires: z.string().datetime() }).parse(b); const target = await User.findById(g.userId); if (!target || !t.participants.includes(g.userId)) fail(422, 'Invite the participant first'); if (target.role === 'buyer' && target.qualification !== 'approved') fail(422, 'Buyer must be qualified by staff'); if (!t.nda.some((n: any) => n.userId === g.userId && n.version === process.env.NDA_VERSION && n.hash === digest(process.env.NDA_TEXT || ''))) fail(422, 'Current NDA acceptance required'); if (g.scope !== 'identity' && !t.documents.some((d: any) => d.id === g.scope && d.review === 'approved')) fail(422, 'Document must be reviewed'); if (new Date(g.expires) <= new Date()) fail(422, 'Expiry must be in the future'); t.grants.push({ ...g, id: randomBytes(12).toString('hex') }); }
    else if (action === 'revoke') { if (!isManager && !isOwner) fail(403, 'Owner or broker only'); t.grants = t.grants.filter((g: any) => g.id !== b.grantId); }
    else if (action === 'upload') { if (!isManager && !isOwner) fail(403, 'Owner or broker only'); const d = z.object({ name: z.string().min(1).max(120), category: z.enum(['financial', 'licence', 'agreement', 'closing_evidence', 'other']), content: z.string().min(4).max(1400000).regex(/^[A-Za-z0-9+/]*={0,2}$/) }).parse(b); t.documents.push({ ...d, id: randomBytes(12).toString('hex'), review: 'pending', uploadedBy: uid, at: new Date() }); }
    else if (action === 'review') { if (!isManager) fail(403, 'Assigned broker only'); const d = t.documents.find((x: any) => x.id === b.documentId); if (!d) fail(404, 'Document not found'); d.review = z.enum(['approved', 'rejected']).parse(b.decision); }
    else if (action === 'offer') { const o = z.object({ amount: z.number().positive(), currency: z.string().length(3), ownershipPercent: z.number().positive().max(100), terms: z.string().min(10).max(4000) }).parse(b); if (o.currency !== t.currency || o.ownershipPercent !== t.ownershipPercent) fail(422, 'Offer must match transition currency and ownership scope'); t.offers.push({ ...o, id: randomBytes(12).toString('hex'), userId: uid, status: 'submitted', at: new Date() }); }
    else if (action === 'accept_offer') { if (!isOwner && !isManager) fail(403, 'Owner or broker only'); if (t.offers.some((x: any) => x.status === 'accepted')) fail(422, 'An offer is already accepted'); const o = t.offers.find((x: any) => x.id === b.offerId); if (!o) fail(404, 'Offer not found'); o.status = 'accepted'; }
    else if (action === 'stage') { if (!isManager) fail(403, 'Assigned broker only'); t.stage = advance(t.stage, z.string().parse(b.stage), t); }
    else if (action === 'task') { if (!isManager) fail(403, 'Assigned broker only'); t.tasks.push({ id: randomBytes(12).toString('hex'), text: z.string().min(3).max(300).parse(b.text), done: false }); }
    else if (action === 'complete_task') { if (!isManager && !isOwner) fail(403, 'Owner or broker only'); const task = t.tasks.find((x: any) => x.id === b.taskId); if (!task) fail(404, 'Task not found'); task.done = true; }
    else fail(404, 'Unknown action');
  }
  const version = z.number().int().min(0).parse(b.version); if (version !== t.version) fail(409, 'Workspace changed. Refresh and retry.');
  t.audit.push({ action, actor: uid, at: new Date(), reason: z.string().min(3).max(500).parse(b.reason) });
  const fields = t.toObject(); delete fields._id; delete fields.__v; fields.version = version + 1;
  const saved: any = await Transition.findOneAndUpdate({ _id: t._id, version }, { $set: fields }, { new: true }).select('-documents.content'); if (!saved) fail(409, 'Workspace changed. Refresh and retry.'); res.json({ success: true, data: view(u, saved.toObject()) });
}));
router.get('/nda', asyncRoute(async (_req, res) => { res.json({ success: true, data: { text: process.env.NDA_TEXT || null, version: process.env.NDA_VERSION || null } }); }));
export default router;
