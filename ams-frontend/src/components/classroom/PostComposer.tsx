"use client"

import React, { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Loader2 } from "lucide-react"

export function PostComposer({
  classId,
  invalidateKey = "class-posts",
}: {
  classId: number
  invalidateKey?: string
}) {
  const [body, setBody] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const reset = () => {
    setBody("")
    setFile(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const post = async () => {
    if (!body.trim() && !file) return
    setPosting(true)
    try {
      const fd = new FormData()
      fd.append("body", body.trim())
      if (file) fd.append("file", file)
      await api.post(`/classes/${classId}/posts`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      queryClient.invalidateQueries({ queryKey: [invalidateKey, classId] })
      toast({ title: "Posted to the stream", variant: "success" })
      reset()
    } catch (err: any) {
      toast({
        title: "Could not post",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <Textarea
        placeholder="Share a post with your class…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
      />
      {file && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
          <Paperclip className="h-3.5 w-3.5" />
          <span className="max-w-[220px] truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = "" }}
            className="ml-1 text-muted-foreground hover:text-destructive"
            aria-label="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          id="post-file-input"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-4 w-4 mr-1.5" />
          Attach file
        </Button>
        <Button size="sm" onClick={post} disabled={posting || (!body.trim() && !file)}>
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </div>
    </div>
  )
}

export default PostComposer
