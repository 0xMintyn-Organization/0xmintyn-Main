import mongoose, { Document, Schema, Model } from "mongoose";

export interface IOrder extends Document {
    productId: string,
    userId: string,
    payment_info: object
}

const orderSchema = new Schema<IOrder>({
    productId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
   
}, { timestamps: true });

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;