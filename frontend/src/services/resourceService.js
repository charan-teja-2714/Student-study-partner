import api from './api'

export const getStudentResources = async (firebaseUid) => {
  const res = await api.get(`/resources/${firebaseUid}`)
  return res.data
}

export const getResourceDownloadUrl = (docId) => {
  return `${api.defaults.baseURL}/resources/file/${docId}`
}

export const getEnrolledSubjects = async (studentUid) => {
  const res = await api.get(`/enrollment/${studentUid}`)
  return res.data
}

export const enrollSubject = async (studentUid, subjectId) => {
  const res = await api.post('/enrollment', { student_uid: studentUid, subject_id: subjectId })
  return res.data
}

export const unenrollSubject = async (studentUid, subjectId) => {
  const res = await api.delete('/enrollment', { data: { student_uid: studentUid, subject_id: subjectId } })
  return res.data
}
