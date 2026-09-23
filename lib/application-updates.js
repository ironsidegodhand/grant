import ApplicationUpdate from '../models/ApplicationUpdate'

export function recordApplicationUpdate({ user, type, title, message, detail = '' }) {
  return ApplicationUpdate.create({ user, type, title, message, detail })
}
