import api from './api'

export const getFacultyTimetable = async (facultyUid) => {
  const res = await api.get(`/timetable/faculty/${facultyUid}`)
  return res.data
}

export const getStudentTimetable = async (firebaseUid) => {
  const res = await api.get(`/timetable/student/${firebaseUid}`)
  return res.data
}

export const createTimetableEntry = async (entry) => {
  const res = await api.post('/timetable', entry)
  return res.data
}

export const updateTimetableEntry = async (entryId, data) => {
  const res = await api.put(`/timetable/${entryId}`, data)
  return res.data
}

export const deleteTimetableEntry = async (entryId) => {
  return api.delete(`/timetable/${entryId}`)
}
