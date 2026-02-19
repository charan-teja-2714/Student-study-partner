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
        if (!tempName.trim()) { cancelRename(); return }
        onRename(item, tempName.trim())
        setIsRenaming(false)
    }

    const cancelRename = () => {
        setTempName(item.name)
        setIsRenaming(false)
    }

    return (
        <div
            className="file-card"
            onDoubleClick={(e) => { if (!isRenaming) openFolder() }}
            onClick={(e) => { if (!menuOpen && !isRenaming) openFolder() }}
        >
            {/* Pin indicator */}
            {item.pinned && <div className="file-pin">📌</div>}

            {/* Three-dot menu trigger */}
            <div
                className="file-menu-trigger"
                onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(prev => !prev)
                }}
            >
                ⋮
            </div>

            {/* Icon */}
            <div className="file-icon">
                {item.type === "folder" ? "📁" : "📄"}
            </div>

            {/* Name / inline rename */}
            {isRenaming ? (
                <input
                    className="rename-input"
                    value={tempName}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={confirmRename}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename()
                        if (e.key === "Escape") cancelRename()
                    }}
                />
            ) : (
                <div
                    className="file-name"
                    onDoubleClick={(e) => { e.stopPropagation(); setIsRenaming(true) }}
                >
                    {item.name}
                </div>
            )}

            {/* Year badge for folders that are tagged to a specific year */}
            {item.type === "folder" && item.year && (
                <div className="file-year-badge" title={`For Year ${item.year}${item.section ? `, Section ${item.section}` : ""}`}>
                    Yr {item.year}{item.section ? ` · ${item.section}` : ""}
                </div>
            )}

            {/* Chapter badge (files only, subject shown by group header) */}
            {item.type === "file" && item.chapter && (
                <div className="file-chapter-badge" title={item.chapter}>
                    {item.chapter}
                </div>
            )}

            {/* Context Menu */}
            {menuOpen && (
                <div className="context-menu" ref={menuRef}>
                    {/* Rename: activates inline editor, does NOT call onRename directly */}
                    <div
                        className="context-item"
                        onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen(false)
                            setIsRenaming(true)
                        }}
                    >
                        ✏ Rename
                    </div>

                    {/* Pin: only for files (folders have synthetic IDs, not real DB IDs) */}
                    {item.type === "file" && (
                        <div
                            className="context-item"
                            onClick={(e) => {
                                e.stopPropagation()
                                onPin(item)
                                setMenuOpen(false)
                            }}
                        >
                            📌 {item.pinned ? "Unpin" : "Pin"}
                        </div>
                    )}

                    <div
                        className="context-item danger"
                        onClick={(e) => {
                            e.stopPropagation()
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
