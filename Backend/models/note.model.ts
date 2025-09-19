import mongoose, { Schema, Document, Types } from "mongoose";

export interface INote extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  content: { type: String, required: true, maxlength: 10000 },
}, {
  timestamps: true,
});

// Ensure only one note per user per course
noteSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const NoteModel = mongoose.model<INote>("Note", noteSchema);

export default NoteModel;
