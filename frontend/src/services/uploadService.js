import api from "./api";

/* Student PDF upload */
export const uploadStudentPDF = async (file, userId, sessionId) => {
  console.log("uploadService: ", file, userId, sessionId)
  const formData = new FormData()
  formData.append("file", file)
  formData.append("user_id", String(userId))
  
  // Only append session_id if it exists and is not null
  if (sessionId !== null && sessionId !== undefined) {
    formData.append("session_id", String(sessionId))
  }

  return api.post("/upload/student", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  })
}

// export const uploadStudentPDF = async (file, userId, sessionId) => {
//   if (!file) throw new Error("File is required")
//   if (!userId) throw new Error("User ID is required")

//   const formData = new FormData()
//   formData.append("file", file)
//   formData.append("user_id", String(userId))

//   // ✅ send session_id ONLY if it exists
//   if (sessionId !== undefined && sessionId !== null) {
//     formData.append("session_id", String(sessionId))
//   }

//   const res = await api.post("/upload/student", formData, {
//     headers: { "Content-Type": "multipart/form-data" }
//   })

//   return res.data   // 🔑 contains session_id
// }


/* Faculty PDF upload with metadata */
export const uploadFacultyPDF = async (file, metadata = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata.faculty_uid) formData.append("faculty_uid", metadata.faculty_uid);
  if (metadata.subject_id) formData.append("subject_id", String(metadata.subject_id));
  if (metadata.chapter) formData.append("chapter", metadata.chapter);
  if (metadata.department) formData.append("department", metadata.department);
  if (metadata.year) formData.append("year", String(metadata.year));
  if (metadata.section) formData.append("section", metadata.section);
  if (metadata.path !== undefined) formData.append("path", metadata.path);

  return api.post("/upload/faculty", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
