import nodemailer from 'nodemailer'
import { randomUUID } from 'node:crypto'

let transport

/* ------------------------------------------------------------------ *
 * Brand tokens
 * ------------------------------------------------------------------ */

const BRAND = {
  name: 'Grantwell',
  ink: '#17233f',
  body: '#53617a',
  label: '#66738c',
  muted: '#8590a4',
  line: '#edf0f5',
  surface: '#f7f8fc',
  border: '#e6eaf5',
  accent: '#405cf5',
  header: 'background-color:#2f45d6;background-image:linear-gradient(120deg,#263fd1,#7658e8)',
}

const TONES = {
  blue: { accent: '#405cf5', soft: '#eef1fe', text: '#3141c4' },
  green: { accent: '#177c4d', soft: '#eaf7f0', text: '#12633e' },
  red: { accent: '#bd4d46', soft: '#fdeeee', text: '#9c3a34' },
  amber: { accent: '#b7791f', soft: '#fdf5e6', text: '#8a5a12' },
}

const PAYMENT_METHODS = {
  bank: { label: 'Bank transfer', eta: '1–3 business days' },
  paypal: { label: 'PayPal', eta: 'Usually within minutes' },
  cashapp: { label: 'Cash App', eta: 'Usually within minutes' },
  wire: { label: 'Wire transfer', eta: 'Same-day processing' },
}

const STATUS_TONES = {
  Accepted: 'green',
  Processing: 'blue',
  'Under Review': 'amber',
  Pending: 'amber',
  Approved: 'green',
  Declined: 'red',
  Rejected: 'red',
}

/* ------------------------------------------------------------------ *
 * SMTP bootstrap
 * ------------------------------------------------------------------ */

function createMailer() {
  const { MAIL_FROM, SMTP_HOST, SMTP_USER, SMTP_PASSWORD } = process.env
  if (!MAIL_FROM || !SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn('Email notifications are disabled: set MAIL_FROM, SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.')
    return null
  }
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })
}

async function mailer() {
  if (!transport) transport = createMailer()
  return transport
}

async function send({ to, subject, text, html }) {
  const activeMailer = await mailer()
  if (!activeMailer) return false
  const info = await activeMailer.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
    replyTo: process.env.MAIL_REPLY_TO || process.env.SUPPORT_EMAIL || process.env.MAIL_FROM,
    headers: {
      'X-Entity-Ref-ID': `grantwell-${randomUUID()}`,
    },
  })
  console.info(`Grantwell email accepted by SMTP: ${info.messageId || 'no message id'} → ${to}`)
  return true
}

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>'"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character],
  )
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

function maskValue(value = '', visible = 4) {
  const text = String(value).trim()
  if (!text) return 'Not provided'
  if (text.length <= visible) return '••••'
  return `•••• ${text.slice(-visible)}`
}

function maskEmail(value = '') {
  const [local, domain] = String(value).trim().split('@')
  if (!local || !domain) return maskValue(value)
  return `${local.slice(0, 1)}•••@${domain}`
}

function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

/** Drops rows that have no value so receipts never show empty labels. */
function compact(rows = []) {
  return rows.filter((row) => Array.isArray(row) && row[0] && row[1] !== undefined && row[1] !== null && row[1] !== '')
}

function toneForStatus(status) {
  return STATUS_TONES[status] || 'blue'
}

function supportEmail() {
  return process.env.MAIL_REPLY_TO || process.env.SUPPORT_EMAIL || 'support@grantwell.com'
}

function paymentSupportGuidance() {
  return `For questions about this update, use the support contact listed in your Grantwell account.`
}

function messagesUrl() {
  const url = appUrl()
  return url ? `${url.replace(/\/$/, '')}/user/messages` : ''
}

function adminMessagesUrl() {
  const url = appUrl()
  return url ? `${url.replace(/\/$/, '')}/admin/messages` : ''
}

function appUrl() {
  return process.env.APP_URL || process.env.CLIENT_URL || ''
}

function ctaFor(label = 'Sign in to Grantwell') {
  const url = appUrl()
  return url ? { label, url } : null
}

function adminEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || ''
}

/* ------------------------------------------------------------------ *
 * UI primitives
 * ------------------------------------------------------------------ */

function detailRow(row, isLast) {
  const [label, value, options = {}] = row
  const tone = TONES[options.tone] || null
  const color = tone ? tone.text : BRAND.ink
  const border = isLast ? 'none' : `1px solid ${BRAND.line}`
  const valueStyle = [
    'padding:12px 0',
    `color:${color}`,
    'font-size:13.5px',
    'font-weight:700',
    'text-align:right',
    'line-height:1.45',
    `border-bottom:${border}`,
    options.mono ? 'font-family:Consolas,Monaco,"Courier New",monospace;letter-spacing:.3px' : '',
  ]
    .filter(Boolean)
    .join(';')

  return `<tr>
    <td style="padding:12px 0;color:${BRAND.label};font-size:13px;line-height:1.45;border-bottom:${border}">${escapeHtml(label)}</td>
    <td style="${valueStyle}">${escapeHtml(value)}</td>
  </tr>`
}

function detailSection({ title, rows = [] }) {
  const visible = compact(rows)
  if (!visible.length) return ''
  const body = visible.map((row, index) => detailRow(row, index === visible.length - 1)).join('')
  const heading = title
    ? `<tr><td colspan="2" style="padding:11px 16px;background:${BRAND.surface};border-bottom:1px solid ${BRAND.line};border-radius:12px 12px 0 0;color:#5a6a8c;font-size:10.5px;font-weight:700;letter-spacing:1.3px">${escapeHtml(
        title.toUpperCase(),
      )}</td></tr>`
    : ''

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:1px solid ${BRAND.border};border-radius:12px;border-collapse:separate">
    ${heading}
    <tr><td colspan="2" style="padding:2px 16px 4px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${body}</table>
    </td></tr>
  </table>`
}

function highlightCard(highlight) {
  if (!highlight?.value) return ''
  const tone = TONES[highlight.tone] || TONES.blue
  const pill = highlight.pill
    ? `<span style="display:inline-block;margin-top:12px;padding:5px 12px;border-radius:999px;background:${tone.soft};color:${tone.text};font-size:11.5px;font-weight:700;letter-spacing:.4px">${escapeHtml(
        highlight.pill,
      )}</span>`
    : ''

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:14px">
    <tr><td style="padding:20px 18px">
      <p style="margin:0 0 6px;color:${BRAND.label};font-size:10.5px;font-weight:700;letter-spacing:1.3px">${escapeHtml(
        String(highlight.label || '').toUpperCase(),
      )}</p>
      <p style="margin:0;color:${BRAND.ink};font-size:29px;font-weight:800;letter-spacing:-1px;line-height:1.15">${escapeHtml(
        highlight.value,
      )}</p>
      ${
        highlight.caption
          ? `<p style="margin:7px 0 0;color:#7b879c;font-size:12.5px;line-height:1.55">${escapeHtml(highlight.caption)}</p>`
          : ''
      }
      ${pill}
    </td></tr>
  </table>`
}

function stepsBlock(steps = []) {
  const visible = steps.filter(Boolean)
  if (!visible.length) return ''
  const items = visible
    .map(
      (step, index) => `<tr>
        <td valign="top" style="width:24px;padding:0 10px 12px 0">
          <div style="width:22px;height:22px;border-radius:50%;background:#eef1fe;color:#3141c4;font-size:11px;font-weight:800;text-align:center;line-height:22px">${
            index + 1
          }</div>
        </td>
        <td valign="top" style="padding:1px 0 12px;color:${BRAND.body};font-size:13.5px;line-height:1.6">${escapeHtml(
          step,
        )}</td>
      </tr>`,
    )
    .join('')

  return `<p style="margin:0 0 10px;color:${BRAND.label};font-size:10.5px;font-weight:700;letter-spacing:1.3px">WHAT HAPPENS NEXT</p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px">${items}</table>`
}

function calloutBlock(callout, toneName = 'blue') {
  if (!callout) return ''
  const tone = TONES[toneName] || TONES.blue
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;background:${tone.soft};border-radius:12px">
    <tr><td style="padding:15px 17px;border-left:4px solid ${tone.accent};border-radius:12px;color:${tone.text};font-size:13px;line-height:1.6">${escapeHtml(
      callout,
    )}</td></tr>
  </table>`
}

function ctaBlock(cta) {
  if (!cta?.url) return ''
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px">
    <tr><td style="border-radius:10px;background:${BRAND.accent}">
      <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px">${escapeHtml(
        cta.label || 'Sign in to Grantwell',
      )}</a>
    </td></tr>
  </table>`
}

/* ------------------------------------------------------------------ *
 * Shell
 * ------------------------------------------------------------------ */

function emailShell({
  preheader = '',
  eyebrow,
  title,
  firstName,
  intro,
  highlight,
  detailRows = [],
  sections = [],
  steps = [],
  callout,
  calloutTone = 'blue',
  reference,
  cta,
  closing = 'Sign in to your Grantwell account to view the latest status and your full history.',
}) {
  const blocks = []
  const messagesLink = messagesUrl()
  const supportFooter = messagesLink
    ? `Use <a href="${escapeHtml(messagesLink)}" style="color:#405cf5;text-decoration:none">Grantwell Messages</a> or contact <a href="mailto:${escapeHtml(supportEmail())}" style="color:#405cf5;text-decoration:none">${escapeHtml(supportEmail())}</a>.`
    : `Contact <a href="mailto:${escapeHtml(supportEmail())}" style="color:#405cf5;text-decoration:none">${escapeHtml(supportEmail())}</a>.`
  if (detailRows.length) blocks.push(detailSection({ rows: detailRows }))
  for (const section of sections) {
    if (section?.rows?.length) blocks.push(detailSection(section))
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title || 'Grantwell')}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;color:${BRAND.ink};font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
<div style="display:none;font-size:1px;color:#f4f6fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(
    preheader,
  )}&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb">
<tr><td style="padding:32px 16px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e9edf6;border-radius:18px;border-collapse:separate">

    <tr><td style="${BRAND.header};padding:24px 34px;border-radius:18px 18px 0 0">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td style="width:32px;height:32px;border-radius:10px;background:#ffffff;color:#3e53d8;font-size:17px;font-weight:800;text-align:center;line-height:32px">G</td>
        <td style="padding-left:10px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-.4px">Grantwell</td>
        <td align="right" style="color:#dfe3ff;font-size:10px;font-weight:700;letter-spacing:1.2px">ACCOUNT NOTIFICATION</td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:32px 34px 28px">
      <p style="margin:0 0 10px;color:#6a78ee;font-size:11px;font-weight:700;letter-spacing:1.5px">${escapeHtml(eyebrow)}</p>
      <h1 style="margin:0 0 18px;color:${BRAND.ink};font-size:26px;line-height:1.2;letter-spacing:-.6px">${escapeHtml(title)}</h1>
      <p style="margin:0 0 14px;color:${BRAND.body};font-size:15px;line-height:1.6">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 24px;color:${BRAND.body};font-size:15px;line-height:1.6">${escapeHtml(intro)}</p>

      ${highlightCard(highlight)}
      ${blocks.join('')}
      ${stepsBlock(steps)}
      ${calloutBlock(callout, calloutTone)}
      ${ctaBlock(cta)}

      <p style="margin:0;color:${BRAND.body};font-size:14px;line-height:1.6">${escapeHtml(closing)}</p>
    </td></tr>

    <tr><td style="padding:22px 34px;background:${BRAND.surface};border-top:1px solid ${BRAND.line};border-radius:0 0 18px 18px;color:${BRAND.muted};font-size:11px;line-height:1.65">
      ${
        reference
          ? `<p style="margin:0 0 7px;color:#6b7893;font-size:11.5px;font-weight:700">Reference: ${escapeHtml(reference)}</p>`
          : ''
      }
      <p style="margin:0 0 7px">Questions about this update? ${supportFooter}</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`
}

/* ------------------------------------------------------------------ *
 * Plain-text mirror (kept in sync with the HTML detail)
 * ------------------------------------------------------------------ */

function buildText({ title, firstName, intro, highlight, detailRows = [], sections = [], steps = [], callout, reference }) {
  const lines = []
  if (title) lines.push(title, '')
  lines.push(`Hi ${firstName},`, '')
  if (intro) lines.push(intro, '')

  if (highlight?.value) {
    lines.push(`${highlight.label}: ${highlight.value}`)
    if (highlight.caption) lines.push(highlight.caption)
    if (highlight.pill) lines.push(`Status: ${highlight.pill}`)
    lines.push('')
  }

  const writeSection = (section) => {
    const rows = compact(section.rows || [])
    if (!rows.length) return
    if (section.title) lines.push(section.title.toUpperCase())
    for (const [label, value] of rows) lines.push(`- ${label}: ${value}`)
    lines.push('')
  }

  if (detailRows.length) writeSection({ rows: detailRows })
  for (const section of sections) writeSection(section)

  if (steps.filter(Boolean).length) {
    lines.push('WHAT HAPPENS NEXT')
    steps.filter(Boolean).forEach((step, index) => lines.push(`${index + 1}. ${step}`))
    lines.push('')
  }

  if (callout) lines.push(callout, '')
  if (reference) lines.push(`Reference: ${reference}`, '')
  lines.push('Sign in to your Grantwell account to view the latest status and your full history.')
  lines.push('', `Questions? Use Grantwell Messages or contact ${supportEmail()}.`)
  return lines.join('\n')
}

/* ------------------------------------------------------------------ *
 * Admin activity
 * ------------------------------------------------------------------ */

export async function sendAdminActivityEmail({ title, intro, detailRows = [], reference }) {
  const email = adminEmail()
  if (!email) return false

  const rows = compact(detailRows)
  const text = buildText({
    title,
    firstName: 'Admin',
    intro,
    detailRows: rows,
    callout: 'This is an automated activity notification.',
    reference,
  })

  return send({
    to: email,
    subject: `Grantwell admin alert: ${title}`,
    text,
    html: emailShell({
      preheader: `${title} — ${intro}`,
      eyebrow: 'ADMIN ACTIVITY',
      title,
      firstName: 'Admin',
      intro,
      detailRows: rows,
      callout: 'This is an automated activity notification. No action is required unless the activity looks unexpected.',
      calloutTone: 'blue',
      reference,
      closing: 'Review the admin dashboard for the complete audit trail of this activity.',
    }),
  })
}

/* ------------------------------------------------------------------ *
 * Security — sign in
 * ------------------------------------------------------------------ */

export function sendUserSignedInEmail({ email, firstName, signedInAt = new Date(), device, location, reference }) {
  const signedIn = formatDate(signedInAt)
  const rows = compact([
    ['Account', maskEmail(email)],
    ['Date & time', signedIn],
    ['Device', device],
    ['Location', location],
    ['Security', 'Password protected'],
  ])

  const steps = [
    'Review the sign-in details above and confirm they match your activity.',
    'If you recognize this sign-in, no further action is needed.',
    'If you do not recognize it, reset your password and contact support immediately.',
  ]

  const intro = 'Your Grantwell account was just signed in to. Here is exactly what we recorded.'

  return send({
    to: email,
    subject: 'New sign-in to your Grantwell account',
    text: buildText({
      title: 'New sign-in detected.',
      firstName,
      intro,
      highlight: { label: 'Account', value: maskEmail(email), caption: signedIn ? `Signed in ${signedIn}` : undefined, pill: 'Sign-in recorded', tone: 'amber' },
      detailRows: rows,
      steps,
      callout: 'If this was not you, contact Grantwell support immediately and change your password.',
      reference,
    }),
    html: emailShell({
      preheader: `A new sign-in to your Grantwell account was recorded${signedIn ? ` on ${signedIn}` : ''}.`,
      eyebrow: 'ACCOUNT SECURITY',
      title: 'New sign-in detected.',
      firstName,
      intro,
      highlight: {
        label: 'Account',
        value: maskEmail(email),
        caption: signedIn ? `Signed in ${signedIn}` : undefined,
        pill: 'Sign-in recorded',
        tone: 'amber',
      },
      detailRows: rows,
      steps,
      callout: 'If this was not you, contact Grantwell support immediately and change your password.',
      calloutTone: 'red',
      reference,
      cta: ctaFor('Review account security'),
    }),
  })
}

/* ------------------------------------------------------------------ *
 * Withdrawals — received
 * ------------------------------------------------------------------ */

export function sendWithdrawalReceivedEmail({
  email,
  firstName,
  requestId,
  amount,
  method,
  destination,
  submittedAt,
  fee,
}) {
  const { label: methodName, eta: deliveryEstimate } = PAYMENT_METHODS[method] || {
    label: method || 'Not provided',
    eta: 'Processing time will be confirmed',
  }
  const submitted = formatDate(submittedAt)

  const destinationRows =
    method === 'bank' || method === 'wire'
      ? [
          ['Destination type', method === 'wire' ? 'Wire transfer' : 'Bank transfer'],
          ['Beneficiary', destination?.beneficiary || 'Not provided'],
          ['Bank name', destination?.bankName || 'Not provided'],
          ['Account / IBAN', maskValue(destination?.accountNumber), { mono: true }],
          [
            method === 'wire' ? 'SWIFT / BIC' : 'Routing number',
            maskValue(method === 'wire' ? destination?.swiftCode : destination?.routingNumber),
            { mono: true },
          ],
        ]
      : [
          ['Destination type', method === 'paypal' ? 'PayPal' : 'Cash App'],
          [
            method === 'paypal' ? 'PayPal account' : 'Cash App handle',
            method === 'paypal' ? maskEmail(destination?.value) : maskValue(destination?.value),
          ],
        ]

  const summaryRows = compact([
    ['Request ID', requestId, { mono: true }],
    ['Withdrawal amount', money(amount)],
    ['Processing fee', fee !== undefined && fee !== null ? money(fee) : undefined],
    ['Payment method', methodName],
    ['Estimated delivery', deliveryEstimate],
    ['Submitted', submitted],
    ['Current status', 'Under Review', { tone: 'amber' }],
  ])

  const steps = [
    'Our team verifies the payment details you submitted.',
    'Your request moves to Processing and you receive another email at that point.',
    'Funds are released to your selected method once the review is complete.',
  ]

  const intro =
    'We received your withdrawal request and will verify the selected payment method before taking the next step. The full breakdown of your request is below.'

  return send({
    to: email,
    subject: 'We received your Grantwell withdrawal request',
    text: buildText({
      title: 'Your withdrawal request is in.',
      firstName,
      intro,
      highlight: {
        label: 'Withdrawal amount',
        value: money(amount),
        caption: `${methodName} • ${deliveryEstimate}`,
        pill: 'Under Review',
        tone: 'amber',
      },
      sections: [
        { title: 'Request summary', rows: summaryRows },
        { title: 'Payment destination', rows: destinationRows },
      ],
      steps,
      callout:
        'For your security, account identifiers in this receipt are masked. We will email you again whenever the request status changes.',
      reference: requestId,
      cta: ctaFor('Track this withdrawal'),
    }),
    html: emailShell({
      preheader: `We received your ${money(amount)} withdrawal request via ${methodName}. Status: Under Review.`,
      eyebrow: 'WITHDRAWAL RECEIVED',
      title: 'Your withdrawal request is in.',
      firstName,
      intro,
      highlight: {
        label: 'Withdrawal amount',
        value: money(amount),
        caption: `${methodName} • ${deliveryEstimate}`,
        pill: 'Under Review',
        tone: 'amber',
      },
      sections: [
        { title: 'Request summary', rows: summaryRows },
        { title: 'Payment destination', rows: destinationRows },
      ],
      steps,
      callout:
        'For your security, account identifiers in this receipt are masked. We will email you again whenever the request status changes.',
      calloutTone: 'blue',
      reference: requestId,
      cta: ctaFor('Track this withdrawal'),
    }),
  })
}

/* ------------------------------------------------------------------ *
 * Withdrawals — status change
 * ------------------------------------------------------------------ */

export function sendWithdrawalStatusEmail({
  email,
  firstName,
  amount,
  status,
  note,
  requestId,
  method,
  destination,
  submittedAt,
  fee,
}) {
  const accepted = status === 'Accepted'
  const processing = status === 'Processing'
  const declined = status === 'Declined'

  const intro = accepted
    ? 'Your withdrawal request has been accepted and is queued for disbursement.'
    : processing
      ? 'Your withdrawal request is now being processed.'
      : declined
        ? 'Your withdrawal request has been declined after review.'
        : 'Your withdrawal request is under review by our funding team.'

  const callout = accepted
    ? `Your request is ready for the next disbursement step. ${paymentSupportGuidance()}`
    : processing
      ? `Your request is being prepared for disbursement. ${paymentSupportGuidance()}`
      : status === 'Under Review'
        ? 'We will email you as soon as the request moves to processing.'
        : note || 'You may contact the funding team if you have questions about this decision.'

  const methodInfo = PAYMENT_METHODS[method]
  const methodName = methodInfo?.label || method
  const submitted = formatDate(submittedAt)
  const feeLabel = processing ? 'Processing fee' : accepted ? 'Disbursement fee' : undefined

  const rows = compact([
    ['Withdrawal amount', money(amount)],
    ['Status', status, { tone: toneForStatus(status) }],
    ['Request ID', requestId, { mono: true }],
    ['Payment method', methodName],
    [feeLabel, fee !== undefined && fee !== null ? money(fee) : undefined],
    ['Estimated delivery', methodInfo?.eta],
    ['Destination', destination?.beneficiary || destination?.value ? maskValue(destination?.beneficiary || destination?.value) : undefined],
    ['Submitted', submitted],
    ['Last updated', formatDate(new Date())],
  ])

  const steps = accepted
    ? [
        'Disbursement is scheduled to your selected payment method.',
        'Review the status in your Grantwell dashboard.',
        'You will receive a final confirmation when disbursement is complete.',
      ]
    : processing
      ? [
        'Your request is being processed by the funding team.',
        'Review the status in your Grantwell dashboard.',
        'You will receive a final confirmation once funds are released.',
        ]
      : declined
        ? [
            'No funds will be released for this request.',
            'The amount remains in your Grantwell account balance.',
            'Contact support if you would like this decision reviewed.',
          ]
        : [
            'Our funding team completes its verification checks.',
            'We email you again when the request moves to Processing.',
            'You can track every status change from your dashboard.',
          ]

  return send({
    to: email,
    subject: `Grantwell withdrawal update: ${status}`,
    text: buildText({
      title: `Withdrawal ${String(status).toLowerCase()}.`,
      firstName,
      intro,
      highlight: {
        label: 'Withdrawal amount',
        value: money(amount),
        caption: methodName ? `Via ${methodName}` : undefined,
        pill: status,
        tone: toneForStatus(status),
      },
      detailRows: rows,
      steps,
      callout,
      reference: requestId,
    }),
    html: emailShell({
      preheader: `${money(amount)} withdrawal is now ${String(status).toLowerCase()}.`,
      eyebrow: 'WITHDRAWAL UPDATE',
      title: `Withdrawal ${String(status).toLowerCase()}.`,
      firstName,
      intro,
      highlight: {
        label: 'Withdrawal amount',
        value: money(amount),
        caption: methodName ? `Via ${methodName}` : undefined,
        pill: status,
        tone: toneForStatus(status),
      },
      detailRows: rows,
      steps,
      callout,
      calloutTone: accepted ? 'green' : declined ? 'red' : 'blue',
      reference: requestId,
      cta: ctaFor('View withdrawal details'),
    }),
  })
}

/* ------------------------------------------------------------------ *
 * Applications — received
 * ------------------------------------------------------------------ */

export async function sendApplicationReceivedEmail({ email, firstName, applicationId, submittedAt, amount, program }) {
  const date = formatDate(submittedAt)
  const intro =
    'Thank you for applying. Our funding team has received your application and will begin its review shortly. Everything we have on file is listed below.'

  const rows = compact([
    ['Application ID', applicationId, { mono: true }],
    ['Program', program],
    ['Requested amount', amount !== undefined && amount !== null ? money(amount) : undefined],
    ['Received', date],
    ['Review window', 'Within 24 hours'],
    ['Current status', 'Under review', { tone: 'amber' }],
  ])

  const steps = [
    'Our funding team reviews your application and supporting details.',
    'We email you with a decision — usually within 24 hours.',
    'If approved, you receive the next steps in your Grantwell account.',
  ]

  return send({
    to: email,
    subject: 'We received your Grantwell application',
    text: buildText({
      title: 'Your application is in.',
      firstName,
      intro,
      highlight: {
        label: 'Application ID',
        value: applicationId || 'Pending assignment',
        caption: date ? `Received ${date}` : undefined,
        pill: 'Under review',
        tone: 'amber',
      },
      detailRows: rows,
      steps,
      callout: 'We will email you as soon as there is an update on your application.',
      reference: applicationId,
    }),
    html: emailShell({
      preheader: `We received application ${applicationId}${date ? ` on ${date}` : ''}. Review takes up to 24 hours.`,
      eyebrow: 'APPLICATION RECEIVED',
      title: 'Your application is in.',
      firstName,
      intro,
      highlight: {
        label: 'Application ID',
        value: applicationId || 'Pending assignment',
        caption: date ? `Received ${date}` : undefined,
        pill: 'Under review',
        tone: 'amber',
      },
      detailRows: rows,
      steps,
      callout: 'We will email you as soon as there is an update on your application.',
      calloutTone: 'blue',
      reference: applicationId,
      cta: ctaFor('View application status'),
    }),
  })
}

/* ------------------------------------------------------------------ *
 * Applications — decision
 * ------------------------------------------------------------------ */

export async function sendApplicationStatusEmail({
  email,
  firstName,
  applicationId,
  status,
  clearanceFee,
  note,
  amount,
  program,
}) {
  const approved = status === 'Approved'
  const declined = status === 'Declined'

  const intro = approved
    ? 'Great news — your application has been approved.'
    : declined
      ? 'We have completed our review and are unable to approve this application at this time.'
      : 'We have completed our review and cannot move this application forward.'

  const rows = compact([
    ['Application ID', applicationId, { mono: true }],
    ['Program', program],
    ['Requested amount', amount !== undefined && amount !== null ? money(amount) : undefined],
    ['Decision', status, { tone: toneForStatus(status) }],
    ['Decision date', formatDate(new Date())],
  ])

  const steps = approved
    ? [
        'Review the decision in your Grantwell dashboard.',
        'The support team will confirm the next steps in your account.',
        'You will receive a notification when the next review stage is complete.',
      ]
    : [
        'No funds will be released for this application.',
        'You may apply again once your circumstances change.',
        'Contact support if you would like this decision reviewed.',
      ]

  return send({
    to: email,
    subject: `Grantwell application update: ${status}`,
    text: buildText({
      title: `Application ${String(status).toLowerCase()}.`,
      firstName,
      intro,
      highlight: {
        label: 'Decision',
        value: status,
        caption: applicationId ? `Application ${applicationId}` : undefined,
        tone: toneForStatus(status),
      },
      detailRows: rows,
      steps,
      callout: note || (approved ? 'Our team will contact you with the next steps.' : 'You may contact our support team if you have questions about this decision.'),
      reference: applicationId,
    }),
    html: emailShell({
      preheader: `Application ${applicationId} is now ${String(status).toLowerCase()}.`,
      eyebrow: 'APPLICATION UPDATE',
      title: `Application ${String(status).toLowerCase()}.`,
      firstName,
      intro,
      highlight: {
        label: 'Decision',
        value: status,
        caption: applicationId ? `Application ${applicationId}` : undefined,
        tone: toneForStatus(status),
      },
      detailRows: rows,
      steps,
      callout:
        note ||
        (approved
          ? 'Our team will contact you with the next steps.'
          : 'You may contact our support team if you have questions about this decision.'),
      calloutTone: approved ? 'green' : 'red',
      reference: applicationId,
      cta: ctaFor('View application'),
    }),
  })
}

/* ------------------------------------------------------------------ *
 * Account adjustments
 * ------------------------------------------------------------------ */

export async function sendAccountAdjustmentEmail({ email, firstName, type, amount, reference, balance, description, postedAt }) {
  const credited = type === 'credit'
  const posted = formatDate(postedAt || new Date())

  const intro = `${money(amount)} has been ${credited ? 'added to' : 'deducted from'} your Grantwell account. The full transaction detail is below.`

  const rows = compact([
    ['Transaction type', credited ? 'Account credit' : 'Account debit'],
    ['Amount', money(amount), { tone: credited ? 'green' : 'red' }],
    ['Reference', reference, { mono: true }],
    ['Description', description],
    ['Posted', posted],
    ['Available balance', money(balance)],
  ])

  return send({
    to: email,
    subject: `Grantwell account ${credited ? 'credit' : 'debit'} posted`,
    text: buildText({
      title: `${credited ? 'Credit' : 'Debit'} posted to your account.`,
      firstName,
      intro,
      highlight: {
        label: credited ? 'Amount credited' : 'Amount debited',
        value: money(amount),
        caption: `Available balance ${money(balance)}`,
        pill: credited ? 'Credit' : 'Debit',
        tone: credited ? 'green' : 'red',
      },
      detailRows: rows,
      callout: 'If you do not recognize this activity, please contact Grantwell support immediately.',
      reference,
    }),
    html: emailShell({
      preheader: `${money(amount)} ${credited ? 'credited to' : 'debited from'} your Grantwell account. Balance: ${money(balance)}.`,
      eyebrow: 'ACCOUNT ACTIVITY',
      title: `${credited ? 'Credit' : 'Debit'} posted to your account.`,
      firstName,
      intro,
      highlight: {
        label: credited ? 'Amount credited' : 'Amount debited',
        value: money(amount),
        caption: `Available balance ${money(balance)}`,
        pill: credited ? 'Credit' : 'Debit',
        tone: credited ? 'green' : 'red',
      },
      detailRows: rows,
      callout: 'If you do not recognize this activity, please contact Grantwell support immediately.',
      calloutTone: credited ? 'green' : 'red',
      reference,
      cta: ctaFor('View account activity'),
    }),
  })
}

/* ------------------------------------------------------------------ *
 * Messages
 * ------------------------------------------------------------------ */

function messagePreview(value = '', limit = 220) {
  const normalized = String(value).replace(/\s+/g, ' ').trim()
  return normalized.length > limit ? `${normalized.slice(0, limit - 1).trimEnd()}…` : normalized
}

export async function sendAdminMessageNotification({ senderName, senderEmail, text }) {
  const preview = messagePreview(text, 2000)
  const intro = `${senderName || 'A customer'} sent a new message in Grantwell Messages. Review the full conversation and reply from the admin workspace.`
  return send({
    to: adminEmail(),
    subject: `New Grantwell message from ${senderName || 'a customer'}`,
    text: buildText({
      title: 'New customer message.',
      intro,
      detailRows: compact([['From', senderName], ['Email', senderEmail]]),
      callout: `Message preview: “${preview}”`,
      cta: adminMessagesUrl() ? { label: 'Open Messages', url: adminMessagesUrl() } : null,
      closing: 'Open Grantwell Messages to read the complete message and reply securely.',
    }),
    html: emailShell({
      preheader: `New message from ${senderName || 'a customer'}: ${preview}`,
      eyebrow: 'NEW CUSTOMER MESSAGE',
      title: 'A customer sent you a message.',
      intro,
      detailRows: compact([['From', senderName], ['Email', senderEmail]]),
      callout: `Message preview: “${preview}”`,
      calloutTone: 'blue',
      cta: adminMessagesUrl() ? { label: 'Open Messages', url: adminMessagesUrl() } : null,
      closing: 'Open Grantwell Messages to read the complete message and reply securely.',
    }),
  })
}

export async function sendUserSupportReplyEmail({ email, firstName, text }) {
  const preview = messagePreview(text)
  const intro = 'Grantwell Funding Support has replied to your message. Sign in to Messages to read the complete response and continue the conversation securely.'
  return send({
    to: email,
    subject: 'Grantwell Support replied to your message',
    text: buildText({
      title: 'You have a new support reply.',
      firstName,
      intro,
      callout: `Reply preview: “${preview}”`,
      cta: messagesUrl() ? { label: 'Open Messages', url: messagesUrl() } : null,
      closing: 'For your privacy, the full conversation is available only in Grantwell Messages.',
    }),
    html: emailShell({
      preheader: `Support replied: ${preview}`,
      eyebrow: 'NEW SUPPORT REPLY',
      title: 'You have a new support reply.',
      firstName,
      intro,
      callout: `Reply preview: “${preview}”`,
      calloutTone: 'blue',
      cta: messagesUrl() ? { label: 'Open Messages', url: messagesUrl() } : null,
      closing: 'For your privacy, the full conversation is available only in Grantwell Messages.',
    }),
  })
}
