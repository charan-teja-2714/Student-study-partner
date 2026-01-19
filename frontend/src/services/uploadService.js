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


/* Faculty PDF upload */
export const uploadFacultyPDF = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload/faculty", formData);
};
