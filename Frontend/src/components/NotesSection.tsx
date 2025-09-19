"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Save, 
  Trash2, 
  Edit3, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesSection() {
  const params = useParams();
  const { toast } = useToast();
  const courseId = params?.courseId as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user's note for this course
  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}note/course/${courseId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const noteData = response.data.note;
        setNote(noteData);
        setContent(noteData?.content || "");
        setHasChanges(false);
      }
    } catch (error: any) {
      console.error("Error fetching note:", error);
      if (error.response?.status !== 403) {
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchNote();
    }
  }, [courseId]);

  // Handle content change
  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== (note?.content || ""));
  };

  // Save note
  const handleSaveNote = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Note content cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}note/save`,
        { courseId, content: content.trim() },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setNote(response.data.note);
        setHasChanges(false);
        toast({
          title: "Success",
          description: "Note saved successfully",
        });
      }
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save note",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!note) return;

    try {
      setDeleting(true);
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URI}note/course/${courseId}`,
        { withCredentials: true }
      );
      
      setNote(null);
      setContent("");
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Spinner text="Loading notes..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle>My Notes</CardTitle>
              <CardDescription>
                Take notes while learning. Your notes are automatically saved and will be available whenever you return to this course.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Note Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">Write Your Notes</CardTitle>
            </div>
            {note && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last updated: {formatDate(note.updatedAt)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Start writing your notes here... You can jot down key concepts, important points, questions, or anything else you want to remember about this course."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[300px] resize-none"
            disabled={saving || deleting}
          />
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unsaved changes
                </Badge>
              )}
              {!hasChanges && note && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {note && (
                <Button
                  variant="outline"
                  onClick={handleDeleteNote}
                  disabled={saving || deleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleting ? (
                    <>
                      <Spinner size="sm" inline />
                      <span className="ml-2">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Note
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={handleSaveNote}
                disabled={saving || deleting || !hasChanges || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" inline />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {note ? "Update Note" : "Save Note"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note Info */}
      {note && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Note saved successfully!</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Your notes are automatically saved and will be available whenever you return to this course.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
