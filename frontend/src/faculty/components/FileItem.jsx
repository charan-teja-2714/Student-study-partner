import React, { useState, useRef, useEffect } from "react"

export default function FileItem({
    item,
    onOpen,
    onRename,
    onPin,
    onDelete
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [isRenaming, setIsRenaming] = useState(false)
    const [tempName, setTempName] = useState(item.name)

    const menuRef = useRef()

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const openFolder = () => {
        if (item.type === "folder") onOpen(item.name)
    }

    const confirmRename = () => {
  if (!tempName.trim()) {
    cancelRename()
    return
  }
  onRename(item, tempName.trim())
  setIsRenaming(false)
}

const cancelRename = () => {
  setTempName(item.name)
  setIsRenaming(false)
}


    return (
        <div className="file-card" onDoubleClick={openFolder}>
            {/* Pin */}
            {item.pinned && <div className="file-pin">📌</div>}

            {/* Three-dot menu */}
            <div
                className="file-menu-trigger"
                onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(prev => !prev)
                }}
            >
                ⋮
            </div>

            {/* Icon + name */}
            <div className="file-icon">
                {item.type === "folder" ? "📁" : "📄"}
            </div>

            {isRenaming ? (
                <input
                    className="rename-input"
                    value={tempName}
                    autoFocus
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => confirmRename()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename()
                        if (e.key === "Escape") cancelRename()
                    }}
                />
            ) : (
                <div
                    className="file-name"
                    onDoubleClick={() => setIsRenaming(true)}
                >
                    {item.name}
                </div>
            )}


            {/* Context Menu */}
            {menuOpen && (
                <div className="context-menu" ref={menuRef}>
                    <div className="context-item" onClick={() => {
                        onRename(item)
                        setMenuOpen(false)
                    }}>
                        ✏ Rename
                    </div>

                    <div className="context-item" onClick={() => {
                        onPin(item)
                        setMenuOpen(false)
                    }}>
                        📌 {item.pinned ? "Unpin" : "Pin"}
                    </div>

                    <div
                        className="context-item danger"
                        onClick={() => {
                            onDelete(item)
                            setMenuOpen(false)
                        }}
                    >
                        🗑 Delete
                    </div>

                </div>
            )}
        </div>
    )
}
