import React, { useEffect, useState } from "react"
import Breadcrumbs from "./components/Breadcrumbs"
import Toolbar from "./components/Toolbar"
import FileGrid from "./components/FileGrid"
import UploadModal from "./components/UploadModal"
import NewFolderModal from "./components/NewFolderModal"

const API_BASE = "http://127.0.0.1:8000"

export default function FileManager() {
    const [path, setPath] = useState(["Faculty"])
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)

    const [showUpload, setShowUpload] = useState(false)
    const [showNewFolder, setShowNewFolder] = useState(false)

    // logical path for backend
    const logicalPath = path.length > 1 ? path.slice(1).join("/") : ""

    // 🔹 SINGLE SOURCE OF TRUTH
    const fetchItems = async () => {
        setLoading(true)
        try {
            const res = await fetch(
                `${API_BASE}/faculty/files?path=${encodeURIComponent(logicalPath)}`
            )
            const data = await res.json()

            const folderItems = data.folders.map((name, index) => ({
                id: `folder-${name}-${index}`,
                name,
                type: "folder",
                pinned: false
            }))

            const fileItems = data.files.map((file) => ({
                id: file.id,
                name: file.name,
                type: "file",
                pinned: file.pinned
            }))

            setItems([...folderItems, ...fileItems])
        } catch (err) {
            console.error("Failed to load faculty files", err)
        } finally {
            setLoading(false)
        }
    }

    // fetch when path changes
    useEffect(() => {
        fetchItems()
    }, [logicalPath])

    // -------- Handlers --------

    const openFolder = (folderName) => {
        setPath(prev => [...prev, folderName])
    }

    const handleCreateFolder = async (name) => {
        try {
            await fetch(`${API_BASE}/faculty/folder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: logicalPath,
                    name
                })
            })
            fetchItems()
        } catch (err) {
            console.error("Create folder error:", err)
        }
    }

    const handlePin = async (item) => {
        await fetch(`${API_BASE}/faculty/${item.id}/pin`, { method: "POST" })
        fetchItems()
    }

    const handleDelete = async (item) => {
        if (item.type === "file") {
            await fetch(`${API_BASE}/faculty/${item.id}`, { method: "DELETE" })
        } else {
            await fetch(`${API_BASE}/faculty/folder`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: item.fullPath })
            })
        }
        fetchItems()
    }

    const handleRename = async (item, newName) => {
        if (item.type === "file") {
            await fetch(`${API_BASE}/faculty/${item.id}/rename`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_name: newName })
            })
        } else {
            // folder rename (logical path based)
            await fetch(`${API_BASE}/faculty/folder/rename`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    old_path: item.fullPath,
                    new_name: newName
                })
            })
        }

        fetchItems()
    }

    return (
        <>
            <Breadcrumbs path={path} setPath={setPath} />

            <Toolbar
                onNewFolder={() => setShowNewFolder(true)}
                onUpload={() => setShowUpload(true)}
            />

            {loading ? (
                <p>Loading...</p>
            ) : (
                <FileGrid
                    items={items}
                    onOpenFolder={openFolder}
                    onRename={handleRename}
                    onPin={handlePin}
                    onDelete={handleDelete}
                />

            )}

            <UploadModal
                open={showUpload}
                onClose={() => setShowUpload(false)}
                currentPath={logicalPath}
                onUploaded={fetchItems}
            />

            <NewFolderModal
                open={showNewFolder}
                onClose={() => setShowNewFolder(false)}
                onCreate={handleCreateFolder}
            />
        </>
    )
}
