"use client"

import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Paperclip, Trash2, Loader2, Clock } from "lucide-react"
import { timeAgo, avatarColor } from "@/components/classroom/format"
import type { Post } from "@/components/classroom/classroomTypes"

export function PostItem({
  post,
  classId,
  currentUserId,
  canDelete,
  invalidateKey = "class-posts",
}: {
  post: Post
  classId: number
  currentUserId?: number
  canDelete: boolean
  invalidateKey?: string
}) {
  const [deleting, setDeleting] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const isMine = currentUserId != null && post.authorId === currentUserId

  const deletePost = async () => {
    setDeleting(true)
    try {
      await api.delete(`/classes/${classId}/posts/${post.id}`)
      queryClient.invalidateQueries({ queryKey: [invalidateKey, classId] })
      toast({ title: "Post deleted", variant: "success" })
    } catch (err: any) {
      toast({
        title: "Could not delete post",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const sizeLabel = post.attachmentSize
    ? post.attachmentSize > 1024 * 1024
      ? `${(post.attachmentSize / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(post.attachmentSize / 1024))} KB`
    : null

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(
          post.authorName
        )}`}
      >
        {post.authorName?.trim().charAt(0).toUpperCase() || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-sm font-semibold text-foreground">{post.authorName}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(post.createdAt)}
          </span>
        </div>
        {post.body && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{post.body}</p>}
        {post.attachmentReference && (
          <a
            href={post.attachmentReference}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span className="max-w-[240px] truncate">
              {post.attachmentFilename || "attachment"}
            </span>
            {sizeLabel && <span className="text-muted-foreground">{sizeLabel}</span>}
          </a>
        )}
        {(canDelete || isMine) && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={deletePost}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1" />
              )}
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PostItem
