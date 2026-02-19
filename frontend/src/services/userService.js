import api from './api'

export const saveUserProfile = async (profileData) => {
  const res = await api.post('/user/profile', profileData)
  return res.data
}

export const getUserProfile = async (firebaseUid) => {
  const res = await api.get(`/user/profile/${firebaseUid}`)
  return res.data
}

export const getSubjects = async (department, year, faculty_uid) => {
  const params = {}
  if (department) params.department = department
  if (year) params.year = year
  if (faculty_uid) params.faculty_uid = faculty_uid
  const res = await api.get('/subjects', { params })
  return res.data
}

export const createSubject = async (name, department, year) => {
  const res = await api.post('/subjects', { name, department, year })
  return res.data
}

export const deleteSubject = async (subjectId) => {
  return api.delete(`/subjects/${subjectId}`)
}

export const getSections = async (department, year) => {
  const params = {}
  if (department) params.department = department
  if (year) params.year = year
  const res = await api.get('/sections', { params })
  return res.data
}

export const createSection = async (department, year, sectionName) => {
  const res = await api.post('/sections', { department, year, section_name: sectionName })
  return res.data
}

export const deleteSection = async (sectionId) => {
  return api.delete(`/sections/${sectionId}`)
}
