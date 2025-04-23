import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
    title: string;
    description: string;
    amount: number;
    currency: string;
    coverImage: string;
    type: "Service" | "Product";
    createdBy: mongoose.Types.ObjectId;
}

const productSchema: Schema<IProduct> = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true, enum: ["USD", "EUR", "GBP", "INR", "AUD"] },
        coverImage: { type: String, required: true },
        type: { type: String, required: true, enum: ["Service", "Product"] },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const ProductModel: Model<IProduct> = mongoose.model("Product", productSchema);

export default ProductModel;
