import mongoose, { Document, Schema, Model } from "mongoose";

export interface IOrder extends Document {
    courseId: string,
    userId: string,
    courseName: string,
    coursePrice: number,
    courseThumbnail: string,
    instructorId: string,
    instructorName: string,
    status: 'pending' | 'completed' | 'cancelled' | 'refunded',
    payment_info?: {
        paymentId?: string,
        paymentMethod?: string,
        paymentStatus?: string,
        transactionId?: string,
        amount?: number,
        currency?: string
    },
    enrolledAt?: Date,
    completedAt?: Date,
    completedLectures?: string[]
}

const orderSchema = new Schema<IOrder>({
    courseId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    courseName: {
        type: String,
        required: true
    },
    coursePrice: {
        type: Number,
        required: true
    },
    courseThumbnail: {
        type: String,
        required: true
    },
    instructorId: {
        type: String,
        required: true
    },
    instructorName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    payment_info: {
        paymentId: String,
        paymentMethod: String,
        paymentStatus: String,
        transactionId: String,
        amount: Number,
        currency: {
            type: String,
            default: 'USD'
        }
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    completedLectures: [{
        type: String
    }]
}, { timestamps: true });

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;