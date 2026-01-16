import React from "react"
import FileItem from "./FileItem"

export default function FileGrid({
    items,
    onOpenFolder,
    onRename,
    onPin,
    onDelete
}) {
    return (
        <div className="file-grid">
            {items.map(item => (
                <FileItem
                    item={item}
                    onOpen={() => {
                        if (item.type === "folder") {
                            onOpenFolder(item.name)
                        }
                    }}
                    onRename={onRename}
                    onPin={onPin}
                    onDelete={onDelete}
                />

            ))}
        </div>
    )
}
