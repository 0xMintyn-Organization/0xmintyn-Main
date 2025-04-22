import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEbook extends Document {
    title: string;
    description: string;
    author: string;
    category: string;
    coverImage: string;
    price: number;
    driveLink: string;
    createdBy: mongoose.Types.ObjectId;
}

const ebookSchema: Schema<IEbook> = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        author: { type: String, required: true },
        category: {
            type: String,
            enum: ["fiction", "non-fiction", "self-help", "education", "biography"],
            required: true,
        },
        coverImage: { type: String, required: true }, // Image URL
        price: { type: Number, required: true },
        driveLink: { type: String, required: true },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const EbookModel: Model<IEbook> = mongoose.model("Ebook", ebookSchema);
export default EbookModel;
