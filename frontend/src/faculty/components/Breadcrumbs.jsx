import React from "react"
import "../../faculty/faculty.css"

export default function Breadcrumbs({ path, setPath }) {
  return (
    <div className="breadcrumbs-container">
      {path.map((folder, index) => {
        const isLast = index === path.length - 1

        return (
          <div key={index} className="breadcrumb-item">
            <span
              className={`breadcrumb-text ${isLast ? "active" : ""}`}
              onClick={() => {
                if (!isLast) {
                  setPath(path.slice(0, index + 1))
                }
              }}
            >
              {folder}
            </span>

            {!isLast && <span className="breadcrumb-separator">›</span>}
          </div>
        )
      })}
    </div>
  )
}
