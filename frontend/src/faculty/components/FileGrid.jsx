import React from "react"
import FileItem from "./FileItem"

export default function FileGrid({
    items,
    onOpenFolder,
    onRename,
    onPin,
    onDelete
}) {
    const folders = items.filter(i => i.type === "folder")
    const files = items.filter(i => i.type === "file")

    // Group files: subject → chapter → files
    const subjectGroups = {}
    const noSubjectFiles = []
    files.forEach(file => {
        const subject = file.subject_name || null
        if (subject) {
            if (!subjectGroups[subject]) subjectGroups[subject] = {}
            const chapter = file.chapter || "__none__"
            if (!subjectGroups[subject][chapter]) subjectGroups[subject][chapter] = []
            subjectGroups[subject][chapter].push(file)
        } else {
            noSubjectFiles.push(file)
        }
    })

    const renderItem = (item) => (
        <FileItem
            key={item.id}
            item={item}
            onOpen={() => { if (item.type === "folder") onOpenFolder(item.name, item.year, item.section) }}
            onRename={onRename}
            onPin={onPin}
            onDelete={onDelete}
        />
    )

    const hasSubjects = Object.keys(subjectGroups).length > 0
    const hasFiles = files.length > 0

    const renderChapterGroups = (chapterMap) => {
        const entries = Object.entries(chapterMap)
        const hasNamedChapters = entries.some(([ch]) => ch !== "__none__")
        return entries.map(([chapter, chFiles]) => (
            <div key={chapter} className={hasNamedChapters ? "chapter-file-group" : ""}>
                {hasNamedChapters && chapter !== "__none__" && (
                    <div className="chapter-group-header">
                        <span>📖</span>
                        <span>{chapter}</span>
                        <span className="chapter-file-count">
                            {chFiles.length} file{chFiles.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}
                {hasNamedChapters && chapter === "__none__" && (
                    <div className="chapter-group-header">
                        <span>📄</span>
                        <span>Other</span>
                    </div>
                )}
                <div className="file-grid">
                    {chFiles.map(renderItem)}
                </div>
            </div>
        ))
    }

    return (
        <div>
            {/* Folders */}
            {folders.length > 0 && (
                <div className="subject-file-group">
                    <div className="subject-group-header">
                        <span className="subject-group-icon">📁</span>
                        Folders
                        <span className="subject-file-count">
                            {folders.length}
                        </span>
                    </div>
                    <div className="file-grid">
                        {folders.map(renderItem)}
                    </div>
                </div>
            )}

            {/* Files grouped by subject → chapter */}
            {Object.entries(subjectGroups).map(([subject, chapterMap]) => {
                const totalFiles = Object.values(chapterMap).reduce((a, b) => a + b.length, 0)
                return (
                    <div key={subject} className="subject-file-group">
                        <div className="subject-group-header">
                            <span className="subject-group-icon">📚</span>
                            {subject}
                            <span className="subject-file-count">{totalFiles} file{totalFiles !== 1 ? "s" : ""}</span>
                        </div>
                        {renderChapterGroups(chapterMap)}
                    </div>
                )
            })}

            {/* Files with no subject */}
            {noSubjectFiles.length > 0 && (
                <div className="subject-file-group">
                    {hasSubjects && (
                        <div className="subject-group-header">
                            <span className="subject-group-icon">📄</span>
                            General
                        </div>
                    )}
                    <div className="file-grid">
                        {noSubjectFiles.map(renderItem)}
                    </div>
                </div>
            )}

            {items.length === 0 && (
                <div className="file-grid-empty">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                    <p>This folder is empty</p>
                </div>
            )}
        </div>
    )
}
