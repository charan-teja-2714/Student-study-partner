// import React from 'react'
// import Navbar from '../components/Common/Navbar'
// import ChatBox from '../components/Chat/ChatBox'

// const StudentDashboard = () => {
//   return (
//     <div className="dashboard">
//       <Navbar />
//       <div className="container">
//         <div className="dashboard-header">
//           <h1>Academic Assistant</h1>
//           <p>Ask questions about your studies and get AI-powered assistance</p>
//         </div>
//         <ChatBox />
//       </div>

//       <style jsx>{`
//         .dashboard {
//           min-height: 100vh;
//           background: #f5f7fa;
//         }

//         .dashboard-header {
//           text-align: center;
//           padding: 40px 0 20px;
//         }

//         .dashboard-header h1 {
//           color: #333;
//           margin-bottom: 8px;
//         }

//         .dashboard-header p {
//           color: #666;
//           font-size: 16px;
//         }

//         @media (max-width: 768px) {
//           .dashboard-header {
//             padding: 20px 0 15px;
//           }

//           .dashboard-header h1 {
//             font-size: 24px;
//           }

//           .dashboard-header p {
//             font-size: 14px;
//             padding: 0 10px;
//           }
//         }

//         @media (max-width: 480px) {
//           .dashboard-header {
//             padding: 15px 0 10px;
//           }

//           .dashboard-header h1 {
//             font-size: 22px;
//           }
//         }
//       `}</style>
//     </div>
//   )
// }

// export default StudentDashboard

import React from 'react'
import Navbar from '../components/Common/Navbar'
import ChatBox from '../components/Chat/ChatBox'
import './StudentDashboard.css'
import ChatLayout from '../components/Chat/Chatlayout'

const StudentDashboard = () => {
  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">
        <ChatLayout />
      </div>
    </div>
  )
}

export default StudentDashboard
