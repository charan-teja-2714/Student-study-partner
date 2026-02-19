import React, { useEffect, useState } from "react"
import Breadcrumbs from "./components/Breadcrumbs"
import Toolbar from "./components/Toolbar"
import FileGrid from "./components/FileGrid"
import UploadModal from "./components/UploadModal"
import NewFolderModal from "./components/NewFolderModal"
import DeleteConfirmDialog from "./components/DeleteConfirmDialog"

const API_BASE = "http://127.0.0.1:8000"

export default function FileManager() {
    const profile = JSON.parse(sessionStorage.getItem('userProfile') || '{}')
    const facultyUid = profile.firebase_uid || sessionStorage.getItem('userId') || ''

    const [path, setPath] = useState(["Faculty"])
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    // Metadata of the folder currently open (for pre-filling UploadModal)
    const [currentFolderMeta, setCurrentFolderMeta] = useState({ year: null, section: null })

    const [showUpload, setShowUpload] = useState(false)
    const [showNewFolder, setShowNewFolder] = useState(false)
    const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })

    // logical path for backend
    const logicalPath = path.length > 1 ? path.slice(1).join("/") : ""

    // Clear folder meta when navigating back to root
    useEffect(() => {
        if (logicalPath === "") {
            setCurrentFolderMeta({ year: null, section: null })
        }
    }, [logicalPath])

    const fetchItems = async () => {
        setLoading(true)
        try {
            const res = await fetch(
                `${API_BASE}/faculty/files?path=${encodeURIComponent(logicalPath)}&faculty_uid=${encodeURIComponent(facultyUid)}`
            )
            const data = await res.json()

            // Folders now return objects with year/section metadata
            const folderItems = data.folders.map((folder, index) => ({
                id: `folder-${folder.name}-${index}`,
                name: folder.name,
                type: "folder",
                pinned: false,
                year: folder.year || null,
                section: folder.section || null,
                fullPath: logicalPath ? `${logicalPath}/${folder.name}` : folder.name
            }))

            const fileItems = data.files.map((file) => ({
                id: file.id,
                name: file.name,
                type: "file",
                pinned: file.pinned,
                subject_name: file.subject_name || null,
                chapter: file.chapter || null
            }))

            setItems([...folderItems, ...fileItems])
        } catch (err) {
            console.error("Failed to load faculty files", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [logicalPath])

    // -------- Handlers --------

    const openFolder = (folderName, year, section) => {
        setPath(prev => [...prev, folderName])
        setCurrentFolderMeta({ year: year || null, section: section || null })
    }

    const handleCreateFolder = async (name, year, section) => {
        try {
            await fetch(`${API_BASE}/faculty/folder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: logicalPath,
                    name,
                    faculty_uid: facultyUid,
                    year: year || null,
                    section: section || null,
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
        setDeleteDialog({ open: true, item })
    }

    const confirmDelete = async () => {
        const { item } = deleteDialog
        try {
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
        } catch (err) {
            console.error("Delete error:", err)
        } finally {
            setDeleteDialog({ open: false, item: null })
        }
    }

    const handleRename = async (item, newName) => {
        if (item.type === "file") {
            await fetch(`${API_BASE}/faculty/${item.id}/rename`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_name: newName })
            })
        } else {
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
                defaultYear={currentFolderMeta.year}
                defaultSection={currentFolderMeta.section}
            />

            <NewFolderModal
                open={showNewFolder}
                onClose={() => setShowNewFolder(false)}
                onCreate={handleCreateFolder}
            />

            <DeleteConfirmDialog
                isOpen={deleteDialog.open}
                itemName={deleteDialog.item?.name}
                itemType={deleteDialog.item?.type}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, item: null })}
            />
        </>
    )
}
