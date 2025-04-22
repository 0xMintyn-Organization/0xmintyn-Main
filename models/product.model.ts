import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    image: string;
    createdBy: mongoose.Types.ObjectId;
}

const productSchema: Schema<IProduct> = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true }, // Image URL
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
